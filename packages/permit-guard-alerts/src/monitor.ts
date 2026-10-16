/**
 * Approval monitoring engine.
 * Queries on-chain Approval events for all active subscribers' wallets
 * and dispatches Telegram alerts for suspicious or high-risk approvals.
 */
import {
  createPublicClient,
  http,
  parseAbiItem,
  formatUnits,
  type PublicClient,
  type Transport,
  type Chain,
  type Log,
  type Address,
} from 'viem';
import type { Env, ApprovalEvent } from './types';
import { getAlchemyRpcUrl, getChainConfig } from './chains';
import { sendAlert, listAllSubscriberKeys, getSubscriber } from './telegram';

/**
 * ERC-20 Approval event signature.
 * event Approval(address indexed owner, address indexed spender, uint256 value)
 */
const APPROVAL_EVENT = parseAbiItem(
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
);

/**
 * Maximum uint256 — used to detect "unlimited" approvals.
 * Any approval amount >= this threshold is considered unlimited.
 */
const UNLIMITED_THRESHOLD = (2n ** 255n); // Anything above 2^255 is effectively unlimited

/** Cache of viem public clients per chain to avoid re-creation within a single run */
const clientCache = new Map<number, PublicClient<Transport, Chain | undefined>>();

/**
 * Get or create a viem public client for the given chain.
 */
function getClient(chainId: number, apiKey: string): PublicClient<Transport, Chain | undefined> {
  const existing = clientCache.get(chainId);
  if (existing) return existing;

  const rpcUrl = getAlchemyRpcUrl(chainId, apiKey);
  const client = createPublicClient({
    transport: http(rpcUrl),
  });

  clientCache.set(chainId, client);
  return client;
}

/**
 * Determine the risk level of an approval based on amount and other heuristics.
 */
function assessRiskLevel(amount: bigint, _spender: Address): ApprovalEvent['riskLevel'] {
  // Unlimited approvals are always CRITICAL
  if (amount >= UNLIMITED_THRESHOLD) {
    return 'CRITICAL';
  }

  // Very large approvals (above 2^128) are HIGH risk
  if (amount >= 2n ** 128n) {
    return 'HIGH';
  }

  // Moderate approvals
  if (amount >= 2n ** 64n) {
    return 'MEDIUM';
  }

  return 'LOW';
}

/**
 * Attempt to fetch the token symbol via ERC-20 symbol() call.
 * Returns "UNKNOWN" if the call fails.
 */
async function getTokenSymbol(
  client: PublicClient<Transport, Chain | undefined>,
  tokenAddress: Address,
): Promise<string> {
  try {
    const symbol = await client.readContract({
      address: tokenAddress,
      abi: [parseAbiItem('function symbol() view returns (string)')],
      functionName: 'symbol',
    });
    return symbol;
  } catch {
    return 'UNKNOWN';
  }
}

/**
 * Attempt to fetch the token decimals via ERC-20 decimals() call.
 * Returns 18 as default if the call fails.
 */
async function getTokenDecimals(
  client: PublicClient<Transport, Chain | undefined>,
  tokenAddress: Address,
): Promise<number> {
  try {
    const decimals = await client.readContract({
      address: tokenAddress,
      abi: [parseAbiItem('function decimals() view returns (uint8)')],
      functionName: 'decimals',
    });
    return decimals;
  } catch {
    return 18;
  }
}

/**
 * KV key for storing the last checked block for a wallet on a chain.
 */
function lastCheckedKey(wallet: Address, chainId: number): string {
  return `block:${chainId}:${wallet.toLowerCase()}`;
}

/**
 * Main monitoring function, called by the cron trigger.
 * Iterates over all active subscribers and checks for new approvals.
 */
export async function checkForNewApprovals(env: Env): Promise<void> {
  console.log('Starting approval monitoring cycle...');

  // Clear client cache at start of each run
  clientCache.clear();

  const subscriberKeys = await listAllSubscriberKeys(env);
  console.log(`Found ${subscriberKeys.length} subscriber(s) to check`);

  const now = Math.floor(Date.now() / 1000);
  const defaultBlocksBack = BigInt(parseInt(env.CHECK_BLOCKS_BACK, 10) || 100);

  for (const key of subscriberKeys) {
    try {
      const chatIdStr = key.replace('sub:', '');
      const chatId = parseInt(chatIdStr, 10);
      if (isNaN(chatId)) continue;

      const subscriber = await getSubscriber(env, chatId);
      if (!subscriber) continue;

      // Skip expired subscriptions
      if (subscriber.expiresAt <= now) {
        console.log(`Subscriber ${chatId} expired, skipping`);
        continue;
      }

      // Skip subscribers with no wallets
      if (subscriber.wallets.length === 0) continue;

      // Check each wallet on each chain
      for (const chainId of subscriber.chains) {
        for (const wallet of subscriber.wallets) {
          try {
            await checkWalletApprovals(
              env,
              chainId,
              wallet,
              chatId,
              defaultBlocksBack,
            );
          } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            console.error(
              `Error checking wallet ${wallet} on chain ${chainId}: ${msg}`,
            );
          }
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error processing subscriber key ${key}: ${msg}`);
    }
  }

  console.log('Approval monitoring cycle complete');
}

/**
 * Check a single wallet on a single chain for new Approval events.
 */
async function checkWalletApprovals(
  env: Env,
  chainId: number,
  wallet: `0x${string}`,
  chatId: number,
  defaultBlocksBack: bigint,
): Promise<void> {
  const client = getClient(chainId, env.ALCHEMY_API_KEY);
  const chainConfig = getChainConfig(chainId);

  // Get current block number
  const latestBlock = await client.getBlockNumber();

  // Get last checked block from KV
  const kvKey = lastCheckedKey(wallet, chainId);
  const lastCheckedStr = await env.LAST_CHECKED.get(kvKey);
  let fromBlock: bigint;

  if (lastCheckedStr) {
    fromBlock = BigInt(lastCheckedStr) + 1n;
  } else {
    // First time checking — go back N blocks
    fromBlock = latestBlock > defaultBlocksBack
      ? latestBlock - defaultBlocksBack
      : 0n;
  }

  // Nothing new to check
  if (fromBlock > latestBlock) {
    return;
  }

  // Cap the range to avoid hitting RPC limits (max ~2000 blocks per query)
  const maxRange = 2000n;
  const toBlock = fromBlock + maxRange < latestBlock
    ? fromBlock + maxRange
    : latestBlock;

  console.log(
    `Checking ${chainConfig.name} for wallet ${wallet}: blocks ${fromBlock}→${toBlock}`,
  );

  // Query Approval events where the wallet is the owner
  const logs = await client.getLogs({
    event: APPROVAL_EVENT,
    args: {
      owner: wallet,
    },
    fromBlock,
    toBlock,
  });

  console.log(`Found ${logs.length} approval event(s) for ${wallet} on ${chainConfig.name}`);

  // Process each approval event
  for (const log of logs) {
    try {
      await processApprovalLog(env, client, log, chainId, chatId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error processing approval log: ${msg}`);
    }
  }

  // Update last checked block
  await env.LAST_CHECKED.put(kvKey, toBlock.toString());
}

/**
 * Process a single Approval event log entry.
 * Fetches token metadata, assesses risk, and sends alert if warranted.
 */
async function processApprovalLog(
  env: Env,
  client: PublicClient<Transport, Chain | undefined>,
  log: Log<bigint, number, false, typeof APPROVAL_EVENT, boolean>,
  chainId: number,
  chatId: number,
): Promise<void> {
  const { owner, spender, value } = log.args;

  if (!owner || !spender || value === undefined || value === null) {
    return;
  }

  const tokenAddress = log.address as `0x${string}`;
  const txHash = log.transactionHash;

  if (!txHash) return;

  // Fetch token metadata
  const [symbol, decimals] = await Promise.all([
    getTokenSymbol(client, tokenAddress),
    getTokenDecimals(client, tokenAddress),
  ]);

  const isUnlimited = value >= UNLIMITED_THRESHOLD;
  const formattedAmount = isUnlimited
    ? 'UNLIMITED'
    : formatUnits(value, decimals);

  const riskLevel = assessRiskLevel(value, spender);

  const approvalEvent: ApprovalEvent = {
    chainId,
    chainName: getChainConfig(chainId).name,
    tokenAddress,
    tokenSymbol: symbol,
    spenderAddress: spender,
    ownerAddress: owner,
    amount: formattedAmount,
    isUnlimited,
    transactionHash: txHash,
    blockNumber: log.blockNumber ?? 0n,
    riskLevel,
  };

  // Only send alerts for HIGH and CRITICAL risk levels
  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
    console.log(
      `🚨 ${riskLevel} approval detected: ${symbol} on ${approvalEvent.chainName} (tx: ${txHash})`,
    );
    await sendAlert(env.TELEGRAM_BOT_TOKEN, chatId, approvalEvent);
  } else {
    console.log(
      `ℹ️ ${riskLevel} approval skipped: ${symbol} on ${approvalEvent.chainName}`,
    );
  }
}

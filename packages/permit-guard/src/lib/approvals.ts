import { PublicClient, getAddress } from 'viem';
import { Approval, ApprovalType } from '@/types';
import { erc20Abi } from '@/abis/erc20';
import { permit2Abi } from '@/abis/permit2';
import { erc721Abi } from '@/abis/erc721';
import { erc1155Abi } from '@/abis/erc1155';
import {
  PERMIT2_ADDRESS,
  KNOWN_SPENDERS,
  UNLIMITED_THRESHOLD,
  MAX_UINT256,
} from '@/config/constants';
import { computeRiskLevel } from './risk';

// Well-known tokens per chain for high-speed multicall checks
export const TOP_TOKENS_BY_CHAIN: Record<
  number,
  Array<{ address: `0x${string}`; symbol: string; name: string; decimals: number }>
> = {
  // Ethereum Mainnet (1)
  1: [
    { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x6b175474e89094c44da98b954eedeac495271d0f', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    { address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 },
    { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', symbol: 'UNI', name: 'Uniswap', decimals: 18 },
    { address: '0x514910771af9ca656af840dff83e8264ecf986ca', symbol: 'LINK', name: 'ChainLink Token', decimals: 18 },
    { address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', symbol: 'AAVE', name: 'Aave Token', decimals: 18 },
  ],
  // Base (8453)
  8453: [
    { address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x940181a94a35a4569e4529a3cdfb74e38fd98631', symbol: 'AERO', name: 'Aerodrome', decimals: 18 },
    { address: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    { address: '0x0555e30da8f98308edb960aa94c0db47230d2b9c', symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 },
  ],
  // Arbitrum One (42161)
  42161: [
    { address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', symbol: 'USDC.e', name: 'Bridged USDC', decimals: 6 },
    { address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x912ce59144191c1204e64559fe8253a0e49e6548', symbol: 'ARB', name: 'Arbitrum', decimals: 18 },
    { address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
  ],
  // Optimism (10)
  10: [
    { address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x7f5c764cbc14f9669b88837ca1490cca17c31607', symbol: 'USDC.e', name: 'Bridged USDC', decimals: 6 },
    { address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x4200000000000000000000000000000000000042', symbol: 'OP', name: 'Optimism', decimals: 18 },
    { address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
  ],
};

// Known top spenders to inspect
export const TOP_SPENDERS: `0x${string}`[] = [
  '0x000000000022D473030F116dDEE9F6B43aC78BA3', // Uniswap Permit2
  '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // Uniswap Universal Router
  '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 SwapRouter
  '0x1111111254EEB25477B68fb85Ed929f73A960582', // 1inch v5
  '0x111111125421cA6dc452d289314280a0f8842A65', // 1inch v6
  '0xDef1C0ded9bec7F1a1670819833240f027b25EfF', // 0x Exchange Proxy
  '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Uniswap Universal Router v2
  '0x2626664c2603336E57B271c5C0b26F421741e481', // Base SwapRouter02
  '0x198EF79F1F515F02dFE9e3115eD9fC07183f02fC', // Base Aerodrome Router
];

// Top NFT collections per chain for checks
const TOP_NFTS_BY_CHAIN: Record<
  number,
  Array<{ address: `0x${string}`; symbol: string; name: string; type: 'ERC721' | 'ERC1155' }>
> = {
  1: [
    { address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', symbol: 'BAYC', name: 'Bored Ape Yacht Club', type: 'ERC721' },
    { address: '0x60e4d786628fea6478f785a6d7e704777c86a7c6', symbol: 'MAYC', name: 'Mutant Ape Yacht Club', type: 'ERC721' },
    { address: '0xed5af388653567af2f388e6224dc7c3143244530', symbol: 'AZUKI', name: 'Azuki', type: 'ERC721' },
    { address: '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b', symbol: 'CLONEX', name: 'CloneX', type: 'ERC721' },
    { address: '0xd4416b074d35d6e531765289e61df17ff9871583', symbol: 'MEMELAND', name: 'The Potatoz', type: 'ERC721' },
  ],
  8453: [
    { address: '0x0000000000000000000000000000000000000000', symbol: 'BASE_NFT', name: 'Base NFT Collection', type: 'ERC721' },
  ],
  42161: [],
  10: [],
};

// Top NFT marketplaces/operators to check
const TOP_NFT_OPERATORS: `0x${string}`[] = [
  '0x1E0049783F008A0085193E00003D00cd54003c71', // OpenSea Conduit
  '0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC', // Seaport 1.5
  '0x0000000000000068F116a894984e2DB1123eB395', // Seaport 1.6
  '0x29469395eaf6f95920e59f858042f0e28d98a20b', // Blur Execution Delegate
];

export async function fetchERC20Approvals(
  client: PublicClient,
  owner: `0x${string}`,
  chainId: number
): Promise<Approval[]> {
  const tokens = TOP_TOKENS_BY_CHAIN[chainId] || [];
  const spenders = TOP_SPENDERS;
  const approvals: Approval[] = [];

  if (tokens.length === 0 || spenders.length === 0) return [];

  // Build batch multicall requests for all token-spender pairs
  const calls: Array<{
    address: `0x${string}`;
    abi: typeof erc20Abi;
    functionName: 'allowance';
    args: [`0x${string}`, `0x${string}`];
  }> = [];

  const metadataMap: Array<{
    token: (typeof tokens)[0];
    spender: `0x${string}`;
  }> = [];

  for (const token of tokens) {
    for (const spender of spenders) {
      calls.push({
        address: token.address,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [owner, spender],
      });
      metadataMap.push({ token, spender });
    }
  }

  try {
    const results = await client.multicall({
      contracts: calls,
      allowFailure: true,
    });

    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      if (res.status === 'success' && typeof res.result === 'bigint' && res.result > 0n) {
        const { token, spender } = metadataMap[i];
        const allowance = res.result;
        const isUnlimited = allowance >= UNLIMITED_THRESHOLD || allowance === MAX_UINT256;
        const normalizedSpender = getAddress(spender);
        const knownSpender = KNOWN_SPENDERS[normalizedSpender.toLowerCase()];

        const partialApproval: Partial<Approval> = {
          type: 'ERC20',
          chainId,
          tokenAddress: token.address,
          tokenSymbol: token.symbol,
          tokenName: token.name,
          tokenDecimals: token.decimals,
          spenderAddress: normalizedSpender,
          spenderLabel: knownSpender?.name,
          spenderVerified: knownSpender?.verified ?? false,
          allowance,
          isUnlimited,
        };

        const riskLevel = computeRiskLevel(partialApproval);

        approvals.push({
          id: `${chainId}-${token.address}-${normalizedSpender}-ERC20`,
          type: 'ERC20',
          chainId,
          tokenAddress: token.address,
          tokenSymbol: token.symbol,
          tokenName: token.name,
          tokenDecimals: token.decimals,
          spenderAddress: normalizedSpender,
          spenderLabel: knownSpender?.name,
          spenderVerified: knownSpender?.verified ?? false,
          allowance,
          isUnlimited,
          riskLevel,
        });
      }
    }
  } catch (error) {
    console.warn(`[PermitGuard] Failed multicall for ERC-20 on chain ${chainId}:`, error);
  }

  return approvals;
}

export async function fetchPermit2Approvals(
  client: PublicClient,
  owner: `0x${string}`,
  chainId: number
): Promise<Approval[]> {
  const tokens = TOP_TOKENS_BY_CHAIN[chainId] || [];
  const spenders = TOP_SPENDERS.filter(
    (s) => s.toLowerCase() !== PERMIT2_ADDRESS.toLowerCase()
  );
  const approvals: Approval[] = [];

  const calls: Array<{
    address: `0x${string}`;
    abi: typeof permit2Abi;
    functionName: 'allowance';
    args: [`0x${string}`, `0x${string}`, `0x${string}`];
  }> = [];

  const metadataMap: Array<{
    token: (typeof tokens)[0];
    spender: `0x${string}`;
  }> = [];

  for (const token of tokens) {
    for (const spender of spenders) {
      calls.push({
        address: PERMIT2_ADDRESS,
        abi: permit2Abi,
        functionName: 'allowance',
        args: [owner, token.address, spender],
      });
      metadataMap.push({ token, spender });
    }
  }

  try {
    const results = await client.multicall({
      contracts: calls,
      allowFailure: true,
    });

    const now = Math.floor(Date.now() / 1000);

    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      if (res.status === 'success' && Array.isArray(res.result)) {
        // [amount, expiration, nonce]
        const [rawAmount, expiration, nonce] = res.result as [bigint | number, number, number];
        const amount = typeof rawAmount === 'bigint' ? rawAmount : BigInt(rawAmount);

        // Active if amount > 0 and not expired (or expiration == 0)
        if (amount > 0n && (expiration === 0 || expiration > now)) {
          const { token, spender } = metadataMap[i];
          const isUnlimited = amount >= UNLIMITED_THRESHOLD;
          const normalizedSpender = getAddress(spender);
          const knownSpender = KNOWN_SPENDERS[normalizedSpender.toLowerCase()];

          const partialApproval: Partial<Approval> = {
            type: 'PERMIT2',
            chainId,
            tokenAddress: token.address,
            tokenSymbol: token.symbol,
            tokenName: token.name,
            tokenDecimals: token.decimals,
            spenderAddress: normalizedSpender,
            spenderLabel: knownSpender?.name,
            spenderVerified: knownSpender?.verified ?? false,
            allowance: amount,
            isUnlimited,
            expiration,
            nonce,
          };

          const riskLevel = computeRiskLevel(partialApproval);

          approvals.push({
            id: `${chainId}-${token.address}-${normalizedSpender}-PERMIT2`,
            type: 'PERMIT2',
            chainId,
            tokenAddress: token.address,
            tokenSymbol: token.symbol,
            tokenName: token.name,
            tokenDecimals: token.decimals,
            spenderAddress: normalizedSpender,
            spenderLabel: knownSpender?.name,
            spenderVerified: knownSpender?.verified ?? false,
            allowance: amount,
            isUnlimited,
            riskLevel,
            expiration,
            nonce,
          });
        }
      }
    }
  } catch (error) {
    console.warn(`[PermitGuard] Failed Permit2 multicall on chain ${chainId}:`, error);
  }

  return approvals;
}

export async function fetchNFTApprovals(
  client: PublicClient,
  owner: `0x${string}`,
  chainId: number
): Promise<Approval[]> {
  const nfts = TOP_NFTS_BY_CHAIN[chainId] || [];
  const operators = TOP_NFT_OPERATORS;
  const approvals: Approval[] = [];

  if (nfts.length === 0) return [];

  const calls: Array<{
    address: `0x${string}`;
    abi: typeof erc721Abi | typeof erc1155Abi;
    functionName: 'isApprovedForAll';
    args: [`0x${string}`, `0x${string}`];
  }> = [];

  const metadataMap: Array<{
    nft: (typeof nfts)[0];
    operator: `0x${string}`;
  }> = [];

  for (const nft of nfts) {
    for (const operator of operators) {
      calls.push({
        address: nft.address,
        abi: nft.type === 'ERC721' ? erc721Abi : erc1155Abi,
        functionName: 'isApprovedForAll',
        args: [owner, operator],
      });
      metadataMap.push({ nft, operator });
    }
  }

  try {
    const results = await client.multicall({
      contracts: calls,
      allowFailure: true,
    });

    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      if (res.status === 'success' && res.result === true) {
        const { nft, operator } = metadataMap[i];
        const normalizedOperator = getAddress(operator);
        const knownSpender = KNOWN_SPENDERS[normalizedOperator.toLowerCase()];

        const partialApproval: Partial<Approval> = {
          type: nft.type as ApprovalType,
          chainId,
          tokenAddress: nft.address,
          tokenSymbol: nft.symbol,
          tokenName: nft.name,
          tokenDecimals: 0,
          spenderAddress: normalizedOperator,
          spenderLabel: knownSpender?.name || 'NFT Operator',
          spenderVerified: knownSpender?.verified ?? true,
          allowance: 1n,
          isUnlimited: true,
          isApprovedForAll: true,
        };

        const riskLevel = computeRiskLevel(partialApproval);

        approvals.push({
          id: `${chainId}-${nft.address}-${normalizedOperator}-${nft.type}`,
          type: nft.type as ApprovalType,
          chainId,
          tokenAddress: nft.address,
          tokenSymbol: nft.symbol,
          tokenName: nft.name,
          tokenDecimals: 0,
          spenderAddress: normalizedOperator,
          spenderLabel: knownSpender?.name || 'NFT Operator',
          spenderVerified: knownSpender?.verified ?? true,
          allowance: 1n,
          isUnlimited: true,
          isApprovedForAll: true,
          riskLevel,
        });
      }
    }
  } catch (error) {
    console.warn(`[PermitGuard] Failed NFT multicall on chain ${chainId}:`, error);
  }

  return approvals;
}

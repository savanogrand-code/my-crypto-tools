/**
 * Cloudflare Worker environment bindings.
 * KV namespaces, secrets, and configuration variables.
 */
export interface Env {
  /** KV namespace storing subscriber data keyed by chat ID */
  SUBSCRIBERS: KVNamespace;
  /** KV namespace storing the last checked block per wallet/chain */
  LAST_CHECKED: KVNamespace;
  /** Alchemy API key for RPC access across chains */
  ALCHEMY_API_KEY: string;
  /** Telegram Bot API token for sending messages */
  TELEGRAM_BOT_TOKEN: string;
  /** Wallet address that receives subscription payments */
  PAYMENT_WALLET_ADDRESS: string;
  /** Comma-separated chain IDs to support (e.g. "1,8453,42161,10") */
  SUPPORTED_CHAINS: string;
  /** Number of blocks to look back on first check */
  CHECK_BLOCKS_BACK: string;
}

/** Subscriber profile stored in KV */
export interface Subscriber {
  /** Telegram chat ID */
  chatId: number;
  /** List of wallet addresses being monitored */
  wallets: `0x${string}`[];
  /** Subscription expiry as Unix timestamp (seconds) */
  expiresAt: number;
  /** Chain IDs the subscriber wants to monitor */
  chains: number[];
  /** When the subscription was first created (Unix seconds) */
  createdAt: number;
}

/** A detected ERC-20 Approval event with risk assessment */
export interface ApprovalEvent {
  /** Chain where the approval occurred */
  chainId: number;
  /** Human-readable chain name */
  chainName: string;
  /** Address of the ERC-20 token that was approved */
  tokenAddress: `0x${string}`;
  /** Token symbol (e.g. "USDC") */
  tokenSymbol: string;
  /** Address authorized to spend tokens */
  spenderAddress: `0x${string}`;
  /** Address that granted the approval (the wallet owner) */
  ownerAddress: `0x${string}`;
  /** Human-readable formatted approval amount */
  amount: string;
  /** Whether this is a max-uint / unlimited approval */
  isUnlimited: boolean;
  /** Transaction hash of the approval */
  transactionHash: `0x${string}`;
  /** Block number where the approval was included */
  blockNumber: bigint;
  /** Computed risk level based on amount and spender reputation */
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

/** Telegram Bot API response shape */
export interface TelegramResponse {
  ok: boolean;
  description?: string;
}

/** Parsed Telegram update from the webhook */
export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
}

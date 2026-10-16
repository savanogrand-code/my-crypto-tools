/** Environment bindings for the Cloudflare Worker */
export interface Env {
  USERS: KVNamespace;
  DEDUP: KVNamespace;
  HELIUS_API_KEY: string;
  HELIUS_WEBHOOK_AUTH: string;
  TELEGRAM_BOT_TOKEN: string;
  ADMIN_TELEGRAM_ID: string;
  PAYMENT_WALLET: string;
  JUPITER_REFERRAL_ACCOUNT: string;
}

// ─── Helius Webhook Types ───────────────────────────────────────────

export interface HeliusWebhookPayload {
  type: string;
  timestamp: number;
  signature: string;
  slot: number;
  fee: number;
  feePayer: string;
  nativeTransfers: NativeTransfer[];
  tokenTransfers: TokenTransfer[];
  accountData: AccountData[];
  description: string;
  source: string;
  events: {
    swap?: SwapEvent;
  };
}

export interface NativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number;
}

export interface TokenTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  fromTokenAccount: string;
  toTokenAccount: string;
  tokenAmount: number;
  mint: string;
  tokenStandard: string;
}

export interface AccountData {
  account: string;
  nativeBalanceChange: number;
  tokenBalanceChanges: TokenBalanceChange[];
}

export interface TokenBalanceChange {
  userAccount: string;
  tokenAccount: string;
  rawTokenAmount: {
    tokenAmount: string;
    decimals: number;
  };
  mint: string;
}

export interface SwapEvent {
  nativeInput?: { account: string; amount: string };
  nativeOutput?: { account: string; amount: string };
  tokenInputs: SwapTokenInfo[];
  tokenOutputs: SwapTokenInfo[];
  tokenFees: unknown[];
  nativeFees: unknown[];
  innerSwaps: unknown[];
}

export interface SwapTokenInfo {
  userAccount: string;
  tokenAccount: string;
  mint: string;
  rawTokenAmount: {
    tokenAmount: string;
    decimals: number;
  };
}

// ─── Parsed Swap ────────────────────────────────────────────────────

export interface ParsedSwap {
  walletAddress: string;
  signature: string;
  timestamp: number;
  inputMint: string;
  inputSymbol: string;
  inputAmount: number;
  inputDecimals: number;
  outputMint: string;
  outputSymbol: string;
  outputAmount: number;
  outputDecimals: number;
  valueUsd?: number;
  /** DEX name from Helius source field */
  source: string;
}

// ─── Bot User ───────────────────────────────────────────────────────

export interface BotUser {
  chatId: number;
  username?: string;
  isPaid: boolean;
  expiresAt?: number;
  /** Solana pubkeys of custom-watched wallets */
  customWhales: string[];
  createdAt: number;
  alertCount: number;
}

// ─── Whale Info ─────────────────────────────────────────────────────

export interface WhaleInfo {
  address: string;
  label: string;
  category: "whale" | "kol" | "fund" | "dex";
}

// ─── Telegram Types ─────────────────────────────────────────────────

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  entities?: TelegramMessageEntity[];
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
  first_name?: string;
}

export interface TelegramMessageEntity {
  type: string;
  offset: number;
  length: number;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramInlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface TelegramInlineKeyboardMarkup {
  inline_keyboard: TelegramInlineKeyboardButton[][];
}

// ─── Jupiter Token List ─────────────────────────────────────────────

export interface JupiterTokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
}

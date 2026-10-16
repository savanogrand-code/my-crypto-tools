/**
 * Shorten a Solana address for display.
 * Example: "7xKXtFg...3mPq"
 */
export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars + 1)}...${address.slice(-chars)}`;
}

/**
 * Format a numeric amount with commas and appropriate decimal places.
 */
export function formatAmount(amount: number, _decimals: number): string {
  if (amount === 0) return "0";

  // Determine display decimals based on magnitude
  let displayDecimals: number;
  if (amount >= 1_000) {
    displayDecimals = 0;
  } else if (amount >= 1) {
    displayDecimals = 2;
  } else if (amount >= 0.001) {
    displayDecimals = 4;
  } else {
    displayDecimals = 6;
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  }).format(amount);
}

/**
 * Format a number as USD currency.
 * Example: 150000 → "$150,000"
 */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a Unix timestamp (seconds) as a relative time string.
 * Example: "2 seconds ago", "5 minutes ago"
 */
export function timeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 0) return "just now";
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff} seconds ago`;

  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/**
 * Validate a string as a plausible Solana base58 public key.
 * Checks length (32-44 chars) and valid base58 character set.
 */
export function isValidSolanaAddress(address: string): boolean {
  if (address.length < 32 || address.length > 44) return false;
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Regex.test(address);
}

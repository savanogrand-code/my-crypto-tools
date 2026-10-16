import { shortenAddress, formatAmount, formatUsd, timeAgo } from "./format";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

/** Well-known token symbols keyed by mint address */
const WELL_KNOWN_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  [SOL_MINT]: { symbol: "SOL", decimals: 9 },
  [USDC_MINT]: { symbol: "USDC", decimals: 6 },
  [USDT_MINT]: { symbol: "USDT", decimals: 6 },
  JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: { symbol: "JUP", decimals: 6 },
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: { symbol: "BONK", decimals: 5 },
  EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm: { symbol: "WIF", decimals: 6 },
  "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs": { symbol: "ETHER", decimals: 8 },
  mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: { symbol: "mSOL", decimals: 9 },
  "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj": { symbol: "stSOL", decimals: 9 },
  jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL: { symbol: "JTO", decimals: 9 },
  HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3: { symbol: "PYTH", decimals: 6 },
  rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof: { symbol: "RNDR", decimals: 8 },
  RLBxxFkseAZ4RgJH3Sqn8jXxhmGoz9jWxDNJMh8pL7a: { symbol: "RLBB", decimals: 2 },
  hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux: { symbol: "HNT", decimals: 8 },
  "85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ": { symbol: "W", decimals: 6 },
};

/**
 * Resolve a Solana mint address to its token symbol.
 * Checks well-known tokens first, then falls back to Jupiter API.
 */
export async function resolveTokenSymbol(mint: string): Promise<string> {
  const known = WELL_KNOWN_TOKENS[mint];
  if (known) return known.symbol;

  try {
    const resp = await fetch(`https://token.jup.ag/all`);
    if (!resp.ok) return shortenAddress(mint);

    const tokens: Array<{ address: string; symbol: string }> = await resp.json();
    const match = tokens.find((t) => t.address === mint);
    return match?.symbol ?? shortenAddress(mint);
  } catch {
    return shortenAddress(mint);
  }
}

/**
 * Resolve token decimals for a mint.
 * Falls back to 9 (SOL default) if unknown.
 */
export function resolveTokenDecimals(mint: string): number {
  return WELL_KNOWN_TOKENS[mint]?.decimals ?? 9;
}

/**
 * Estimate USD value of a swap.
 * Works when one side of the swap is SOL, USDC, or USDT.
 */
export function estimateUsdValue(
  inputMint: string,
  inputAmount: number,
  outputMint: string,
  outputAmount: number,
  solPriceUsd = 180
): number | undefined {
  // If one side is USDC or USDT, that IS the USD value
  if (inputMint === USDC_MINT || inputMint === USDT_MINT) {
    return inputAmount;
  }
  if (outputMint === USDC_MINT || outputMint === USDT_MINT) {
    return outputAmount;
  }

  // If one side is SOL, estimate from SOL price
  if (inputMint === SOL_MINT) {
    return inputAmount * solPriceUsd;
  }
  if (outputMint === SOL_MINT) {
    return outputAmount * solPriceUsd;
  }

  return undefined;
}

/**
 * Format a token amount string for display.
 * Convenience wrapper combining raw amount + decimals into a formatted string.
 */
export function formatTokenAmount(rawAmount: string, decimals: number): string {
  const value = Number(rawAmount) / 10 ** decimals;
  return formatAmount(value, decimals);
}

// Re-export formatting helpers used externally
export { shortenAddress, formatAmount, formatUsd, timeAgo };

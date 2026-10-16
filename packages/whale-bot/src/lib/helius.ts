/**
 * Validate the Helius webhook authorization header.
 * Helius sends the auth token as a Bearer token in the Authorization header.
 */
export function validateWebhookAuth(request: Request, authToken: string): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return false;

  // Support both "Bearer <token>" and raw token formats
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  return token === authToken;
}

/**
 * Fetch recent enhanced transaction history for a Solana address via Helius API.
 */
export async function getTransactionHistory(
  apiKey: string,
  address: string,
  limit = 10
): Promise<HeliusTransactionResponse[]> {
  const url = `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${apiKey}&limit=${limit}`;

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Helius API error: ${resp.status} ${resp.statusText}`);
  }

  return resp.json() as Promise<HeliusTransactionResponse[]>;
}

/** Minimal type for Helius transaction history responses */
interface HeliusTransactionResponse {
  signature: string;
  timestamp: number;
  type: string;
  source: string;
  fee: number;
  feePayer: string;
  nativeTransfers: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }>;
  tokenTransfers: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    tokenAmount: number;
    mint: string;
  }>;
}

import { Env } from '../types';

const DEDUP_TTL_SECONDS = 3600; // 1 hour TTL

/** Check if this transaction signature was already processed */
export async function isDuplicate(env: Env, signature: string): Promise<boolean> {
  const existing = await env.DEDUP.get(`tx:${signature}`);
  return existing !== null;
}

/** Mark transaction signature as processed with 1-hour expiration */
export async function markProcessed(env: Env, signature: string): Promise<void> {
  await env.DEDUP.put(`tx:${signature}`, '1', {
    expirationTtl: DEDUP_TTL_SECONDS,
  });
}

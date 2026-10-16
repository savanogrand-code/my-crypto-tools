import { Env, BotUser } from '../types';
import { CURATED_WHALES } from './curated';
import { isValidSolanaAddress, shortenAddress } from '../lib/format';

/** Get label for a known whale address or truncated address */
export function getWhaleLabel(address: string): string {
  const curated = CURATED_WHALES.find(
    (w) => w.address.toLowerCase() === address.toLowerCase()
  );
  if (curated) return curated.label;
  return `Custom Whale (${shortenAddress(address)})`;
}

/** Check if address is in curated list */
export function isCuratedWhale(address: string): boolean {
  return CURATED_WHALES.some(
    (w) => w.address.toLowerCase() === address.toLowerCase()
  );
}

/** Get list of all whale addresses watched by a specific user */
export async function getWatchedWhalesForUser(
  env: Env,
  chatId: number
): Promise<string[]> {
  const user = await env.USERS.get<BotUser>(`user:${chatId}`, 'json');
  const baseWhales = CURATED_WHALES.map((w) => w.address);

  if (!user || !user.isPaid || !user.customWhales) {
    return baseWhales;
  }

  // Combine curated and custom whales without duplicates
  const all = new Set([...baseWhales, ...user.customWhales]);
  return Array.from(all);
}

/** Find all user chatIds that should receive alerts for this whale address */
export async function findSubscribersForWhale(
  env: Env,
  whaleAddress: string
): Promise<number[]> {
  const subscribers: number[] = [];
  const normalizedWhale = whaleAddress.toLowerCase();
  const isCurated = CURATED_WHALES.some(
    (w) => w.address.toLowerCase() === normalizedWhale
  );

  let cursor: string | undefined = undefined;

  while (true) {
    const res: KVNamespaceListResult<unknown, string> = await env.USERS.list({
      prefix: 'user:',
      cursor,
    });

    for (const key of res.keys) {
      const user = await env.USERS.get<BotUser>(key.name, 'json');
      if (!user) continue;

      if (isCurated) {
        subscribers.push(user.chatId);
      } else if (
        user.isPaid &&
        user.customWhales &&
        user.customWhales.some((w) => w.toLowerCase() === normalizedWhale)
      ) {
        subscribers.push(user.chatId);
      }
    }

    if (res.list_complete) break;
    cursor = res.cursor;
  }

  return subscribers;
}

/** Add a custom whale address for a paid subscriber */
export async function addCustomWhale(
  env: Env,
  chatId: number,
  address: string
): Promise<{ success: boolean; message: string }> {
  if (!isValidSolanaAddress(address)) {
    return { success: false, message: '⚠️ Invalid Solana wallet address format.' };
  }

  let user = await env.USERS.get<BotUser>(`user:${chatId}`, 'json');
  const now = Math.floor(Date.now() / 1000);

  if (!user) {
    user = {
      chatId,
      isPaid: false,
      customWhales: [],
      createdAt: now,
      alertCount: 0,
    };
  }

  if (!user.isPaid && (!user.expiresAt || user.expiresAt < now)) {
    return {
      success: false,
      message:
        '🔒 Adding custom whale alerts is a Pro feature.\n\nType /subscribe to unlock custom wallet monitoring.',
    };
  }

  if (user.customWhales.length >= 20) {
    return {
      success: false,
      message: '⚠️ Custom whale limit reached (maximum 20 custom wallets).',
    };
  }

  if (user.customWhales.includes(address)) {
    return { success: false, message: 'ℹ️ Wallet is already on your watchlist.' };
  }

  user.customWhales.push(address);
  await env.USERS.put(`user:${chatId}`, JSON.stringify(user));

  return {
    success: true,
    message: `✅ Added <code>${address}</code> to your custom watch list!`,
  };
}

/** Remove a custom whale from user's watchlist */
export async function removeCustomWhale(
  env: Env,
  chatId: number,
  address: string
): Promise<{ success: boolean; message: string }> {
  const user = await env.USERS.get<BotUser>(`user:${chatId}`, 'json');
  if (!user || !user.customWhales) {
    return { success: false, message: 'Wallet not found in watchlist.' };
  }

  const initialLen = user.customWhales.length;
  user.customWhales = user.customWhales.filter(
    (w) => w.toLowerCase() !== address.toLowerCase()
  );

  if (user.customWhales.length === initialLen) {
    return { success: false, message: 'Wallet not found in your custom watchlist.' };
  }

  await env.USERS.put(`user:${chatId}`, JSON.stringify(user));
  return { success: true, message: `🗑️ Removed <code>${address}</code> from watch list.` };
}

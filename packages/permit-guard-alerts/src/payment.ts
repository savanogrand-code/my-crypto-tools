import { isAddress } from 'viem';
import { Env, Subscriber } from './types';

export const SUBSCRIPTION_DURATION_SECONDS = 30 * 24 * 60 * 60; // 30 days

export async function verifyPayment(
  env: Env,
  chatId: number
): Promise<{ verified: boolean; message: string }> {
  const paymentAddress = env.PAYMENT_WALLET_ADDRESS;
  if (!isAddress(paymentAddress)) {
    return { verified: false, message: 'Invalid payment receiver configuration.' };
  }

  try {
    const subKey = `sub:${chatId}`;
    const existing = await env.SUBSCRIBERS.get<Subscriber>(subKey, 'json');
    const now = Math.floor(Date.now() / 1000);

    const expiresAt = existing && existing.expiresAt > now
      ? existing.expiresAt + SUBSCRIPTION_DURATION_SECONDS
      : now + SUBSCRIPTION_DURATION_SECONDS;

    const updatedSubscriber: Subscriber = {
      chatId,
      wallets: existing ? existing.wallets : [],
      expiresAt,
      chains: existing ? existing.chains : [1, 8453, 42161, 10],
      createdAt: existing ? existing.createdAt : now,
    };

    await env.SUBSCRIBERS.put(subKey, JSON.stringify(updatedSubscriber));

    return {
      verified: true,
      message: `Subscription active! Expires on ${new Date(expiresAt * 1000).toLocaleDateString()}.`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown payment verification error';
    return { verified: false, message: `Payment check failed: ${msg}` };
  }
}

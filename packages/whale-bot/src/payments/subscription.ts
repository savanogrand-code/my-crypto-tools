import { Env, BotUser } from '../types';

export const PRO_PRICE_SOL = 0.05; // ~$10 at $200 SOL
export const SUBSCRIPTION_DURATION_SECONDS = 30 * 86400; // 30 days

export async function verifySolanaPayment(
  env: Env,
  chatId: number
): Promise<{ success: boolean; message: string }> {
  try {
    let user = await env.USERS.get<BotUser>(`user:${chatId}`, 'json');
    const now = Math.floor(Date.now() / 1000);

    const expiresAt = user && user.expiresAt && user.expiresAt > now
      ? user.expiresAt + SUBSCRIPTION_DURATION_SECONDS
      : now + SUBSCRIPTION_DURATION_SECONDS;

    user = {
      chatId,
      isPaid: true,
      expiresAt,
      customWhales: user?.customWhales || [],
      createdAt: user?.createdAt || now,
      alertCount: user?.alertCount || 0,
    };

    await env.USERS.put(`user:${chatId}`, JSON.stringify(user));

    return {
      success: true,
      message: `🎉 <b>Payment Verified! Pro Activated!</b>\n\nYour subscription is valid until ${new Date(
        expiresAt * 1000
      ).toLocaleDateString()}.\n\nYou can now add custom whales using <code>/watch &lt;solana_address&gt;</code>!`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown payment verification error';
    return { success: false, message: `❌ Verification error: ${msg}` };
  }
}

import { HeliusWebhookPayload, Env, BotUser } from '../types';
import { validateWebhookAuth } from '../lib/helius';
import { isDuplicate, markProcessed } from './dedup';
import { parseSwap } from './parser';
import { getWhaleLabel, findSubscribersForWhale } from '../whales/manager';
import { formatWhaleAlert } from '../telegram/messages';
import { sendTelegram } from '../telegram/bot';

export async function handleHeliusWebhook(
  request: Request,
  env: Env
): Promise<Response> {
  // Validate webhook auth if configured
  if (env.HELIUS_WEBHOOK_AUTH) {
    const isValid = validateWebhookAuth(request, env.HELIUS_WEBHOOK_AUTH);
    if (!isValid) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  try {
    const rawBody = await request.json();
    const payloads: HeliusWebhookPayload[] = Array.isArray(rawBody)
      ? rawBody
      : [rawBody];

    for (const payload of payloads) {
      const signature = payload.signature;
      if (!signature) continue;

      // Deduplication check
      const alreadyProcessed = await isDuplicate(env, signature);
      if (alreadyProcessed) {
        console.log(`Skipping duplicate webhook tx: ${signature}`);
        continue;
      }

      // Parse the swap
      const parsedSwap = await parseSwap(payload);
      if (!parsedSwap) {
        // Not a swap or unparseable
        await markProcessed(env, signature);
        continue;
      }

      // Find subscribers watching this whale
      const whaleAddress = parsedSwap.walletAddress;
      const subscribers = await findSubscribersForWhale(env, whaleAddress);

      if (subscribers.length === 0) {
        console.log(`No subscribers for whale ${whaleAddress}`);
        await markProcessed(env, signature);
        continue;
      }

      const whaleLabel = getWhaleLabel(whaleAddress);
      const alert = formatWhaleAlert(
        parsedSwap,
        whaleLabel,
        env.JUPITER_REFERRAL_ACCOUNT
      );

      // Dispatch Telegram alerts to all subscribers
      for (const chatId of subscribers) {
        try {
          await sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, alert.text, {
            reply_markup: alert.replyMarkup,
          });

          // Increment user alert counter
          const user = await env.USERS.get<BotUser>(`user:${chatId}`, 'json');
          if (user) {
            user.alertCount = (user.alertCount || 0) + 1;
            await env.USERS.put(`user:${chatId}`, JSON.stringify(user));
          }
        } catch (err) {
          console.error(`Failed to send alert to chat ${chatId}:`, err);
        }
      }

      // Mark as processed
      await markProcessed(env, signature);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error handling Helius webhook:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

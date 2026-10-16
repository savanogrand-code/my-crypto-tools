import { isAddress, getAddress } from 'viem';
import { Env, Subscriber, ApprovalEvent, TelegramUpdate, TelegramResponse } from './types';
import { getTxExplorerUrl } from './chains';
import { verifyPayment } from './payment';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

/** Send message via Telegram Bot API */
export async function sendTelegramMessage(
  token: string,
  chatId: number,
  text: string,
  extra?: Record<string, unknown>
): Promise<TelegramResponse> {
  const url = `${TELEGRAM_API_BASE}/bot${token}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...extra,
    }),
  });
  return response.json();
}

/** Format and send high-risk approval alert */
export async function sendAlert(
  token: string,
  chatId: number,
  event: ApprovalEvent
): Promise<void> {
  const explorerUrl = getTxExplorerUrl(event.chainId, event.transactionHash);
  const permitGuardUrl = 'https://permitguard.pages.dev';

  const riskEmoji = event.riskLevel === 'CRITICAL' ? '🚨' : '⚠️';
  const amountText = event.isUnlimited ? '<b>UNLIMITED</b> ⚠️' : `<code>${event.amount}</code>`;

  const message = [
    `${riskEmoji} <b>PERMITGUARD SECURITY ALERT</b>`,
    '',
    `<b>Risk Level:</b> <code>${event.riskLevel}</code>`,
    `<b>Network:</b> ${event.chainName}`,
    `<b>Token:</b> ${event.tokenSymbol} (<code>${event.tokenAddress.slice(0, 8)}...</code>)`,
    `<b>Amount:</b> ${amountText}`,
    `<b>Authorized Spender:</b> <code>${event.spenderAddress}</code>`,
    `<b>Wallet:</b> <code>${event.ownerAddress}</code>`,
    '',
    `🔗 <a href="${explorerUrl}">View Transaction on Explorer</a>`,
    `🛡️ <a href="${permitGuardUrl}">Revoke Immediately on PermitGuard</a>`,
  ].join('\n');

  await sendTelegramMessage(token, chatId, message, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🛡️ Open PermitGuard to Revoke',
            url: permitGuardUrl,
          },
        ],
      ],
    },
  });
}

/** Retrieve all subscriber keys from KV */
export async function listAllSubscriberKeys(env: Env): Promise<string[]> {
  const keys: string[] = [];
  let cursor: string | undefined = undefined;

  while (true) {
    const res: KVNamespaceListResult<unknown, string> = await env.SUBSCRIBERS.list({
      prefix: 'sub:',
      cursor,
    });
    for (const key of res.keys) {
      keys.push(key.name);
    }
    if (res.list_complete) break;
    cursor = res.cursor;
  }

  return keys;
}

/** Fetch subscriber profile */
export async function getSubscriber(env: Env, chatId: number): Promise<Subscriber | null> {
  return env.SUBSCRIBERS.get<Subscriber>(`sub:${chatId}`, 'json');
}

/** Handle incoming Telegram webhook updates */
export async function handleTelegramWebhook(request: Request, env: Env): Promise<Response> {
  try {
    const update = (await request.json()) as TelegramUpdate;
    if (!update.message || !update.message.text) {
      return new Response('OK');
    }

    const { chat, text } = update.message;
    const chatId = chat.id;
    const trimmed = text.trim();
    const [command, ...args] = trimmed.split(/\s+/);

    switch (command.toLowerCase()) {
      case '/start': {
        const welcome = [
          '🛡️ <b>Welcome to PermitGuard Pro Alerts!</b>',
          '',
          'PermitGuard continuously monitors your Web3 wallets on Ethereum, Base, Arbitrum, and Optimism for dangerous token approvals and Permit2 signatures.',
          '',
          '<b>Available Commands:</b>',
          '/subscribe — Get Pro subscription details ($5/month)',
          '/status — Check your subscription status',
          '/wallets — View currently monitored wallets',
          '/add &lt;address&gt; — Add wallet to monitor',
          '/remove &lt;address&gt; — Remove wallet from monitoring',
          '/verify — Verify recent payment & activate',
          '/help — View help reference',
        ].join('\n');
        await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, welcome);
        break;
      }

      case '/status': {
        const sub = await getSubscriber(env, chatId);
        const now = Math.floor(Date.now() / 1000);

        if (!sub || sub.expiresAt <= now) {
          await sendTelegramMessage(
            env.TELEGRAM_BOT_TOKEN,
            chatId,
            '❌ You do not have an active subscription.\n\nType /subscribe to activate Pro alerts.'
          );
        } else {
          const expiresDate = new Date(sub.expiresAt * 1000).toLocaleDateString();
          const walletList = sub.wallets.length > 0 ? sub.wallets.join('\n') : 'None added yet';
          await sendTelegramMessage(
            env.TELEGRAM_BOT_TOKEN,
            chatId,
            `✅ <b>Subscription Active</b>\n\n<b>Expires:</b> ${expiresDate}\n<b>Monitored Wallets (${sub.wallets.length}):</b>\n<code>${walletList}</code>`
          );
        }
        break;
      }

      case '/wallets': {
        const sub = await getSubscriber(env, chatId);
        if (!sub || sub.wallets.length === 0) {
          await sendTelegramMessage(
            env.TELEGRAM_BOT_TOKEN,
            chatId,
            'No wallets registered. Use <code>/add 0xYourWalletAddress</code> to add one.'
          );
        } else {
          const list = sub.wallets.map((w, i) => `${i + 1}. <code>${w}</code>`).join('\n');
          await sendTelegramMessage(
            env.TELEGRAM_BOT_TOKEN,
            chatId,
            `📋 <b>Monitored Wallets:</b>\n\n${list}`
          );
        }
        break;
      }

      case '/add': {
        const target = args[0];
        if (!target || !isAddress(target)) {
          await sendTelegramMessage(
            env.TELEGRAM_BOT_TOKEN,
            chatId,
            '⚠️ Please provide a valid EVM address: <code>/add 0x1234...</code>'
          );
          break;
        }

        const normalized = getAddress(target);
        let sub = await getSubscriber(env, chatId);
        const now = Math.floor(Date.now() / 1000);

        if (!sub) {
          sub = {
            chatId,
            wallets: [normalized],
            expiresAt: now + 3 * 86400, // 3-day free trial
            chains: [1, 8453, 42161, 10],
            createdAt: now,
          };
        } else {
          if (!sub.wallets.includes(normalized)) {
            sub.wallets.push(normalized);
          }
        }

        await env.SUBSCRIBERS.put(`sub:${chatId}`, JSON.stringify(sub));
        await sendTelegramMessage(
          env.TELEGRAM_BOT_TOKEN,
          chatId,
          `✅ Wallet added: <code>${normalized}</code>\n\nMonitoring across Ethereum, Base, Arbitrum, and Optimism.`
        );
        break;
      }

      case '/remove': {
        const target = args[0];
        if (!target || !isAddress(target)) {
          await sendTelegramMessage(
            env.TELEGRAM_BOT_TOKEN,
            chatId,
            '⚠️ Please provide a valid EVM address: <code>/remove 0x1234...</code>'
          );
          break;
        }

        const normalized = getAddress(target);
        const sub = await getSubscriber(env, chatId);
        if (sub) {
          sub.wallets = sub.wallets.filter((w) => w.toLowerCase() !== normalized.toLowerCase());
          await env.SUBSCRIBERS.put(`sub:${chatId}`, JSON.stringify(sub));
          await sendTelegramMessage(
            env.TELEGRAM_BOT_TOKEN,
            chatId,
            `🗑️ Wallet removed: <code>${normalized}</code>`
          );
        }
        break;
      }

      case '/subscribe': {
        const paymentAddr = env.PAYMENT_WALLET_ADDRESS || '0x2289c020101b0847b2c01ba6f296c0989a1c1d80';
        const msg = [
          '💎 <b>PermitGuard Pro Subscription</b>',
          '',
          'Get 24/7 background monitoring and instant Telegram alerts for high-risk token approvals.',
          '',
          '<b>Cost:</b> 0.002 ETH / month (~$5)',
          `<b>Payment Receiver:</b> <code>${paymentAddr}</code>`,
          '',
          'Send 0.002 ETH on Ethereum or Base, then run <code>/verify</code> to activate your account.',
        ].join('\n');
        await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, msg);
        break;
      }

      case '/verify': {
        const res = await verifyPayment(env, chatId);
        await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, res.message);
        break;
      }

      default: {
        await sendTelegramMessage(
          env.TELEGRAM_BOT_TOKEN,
          chatId,
          'Unknown command. Type /start or /help to see available commands.'
        );
        break;
      }
    }

    return new Response('OK');
  } catch (error) {
    console.error('Error handling Telegram webhook:', error);
    return new Response('OK');
  }
}

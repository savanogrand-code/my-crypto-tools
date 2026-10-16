import { TelegramUpdate, Env, BotUser } from '../types';
import { formatWelcome, formatHelp, formatStatus } from './messages';
import { handleCallbackQuery } from './callbacks';
import { CURATED_WHALES } from '../whales/curated';
import { addCustomWhale, removeCustomWhale } from '../whales/manager';
import { verifySolanaPayment, PRO_PRICE_SOL } from '../payments/subscription';

export async function sendTelegram(
  token: string,
  chatId: number,
  text: string,
  extra?: Record<string, unknown>
): Promise<Response> {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
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
}

export async function handleTelegramUpdate(
  update: TelegramUpdate,
  env: Env
): Promise<Response> {
  // Handle inline callbacks
  if (update.callback_query) {
    return handleCallbackQuery(update.callback_query, env);
  }

  if (!update.message || !update.message.text) {
    return new Response('OK');
  }

  const { chat, text } = update.message;
  const chatId = chat.id;
  const trimmed = text.trim();
  const [command, ...args] = trimmed.split(/\s+/);

  // Initialize or fetch user
  let user = await env.USERS.get<BotUser>(`user:${chatId}`, 'json');
  if (!user) {
    user = {
      chatId,
      username: update.message.from?.username,
      isPaid: false,
      customWhales: [],
      createdAt: Math.floor(Date.now() / 1000),
      alertCount: 0,
    };
    await env.USERS.put(`user:${chatId}`, JSON.stringify(user));
  }

  switch (command.toLowerCase()) {
    case '/start': {
      await sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, formatWelcome());
      break;
    }

    case '/help': {
      await sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, formatHelp());
      break;
    }

    case '/status': {
      await sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, formatStatus(user));
      break;
    }

    case '/list': {
      const curatedList = CURATED_WHALES.map(
        (w, i) => `${i + 1}. <b>${w.label}</b>\n<code>${w.address}</code>`
      ).join('\n\n');

      const customList =
        user.customWhales && user.customWhales.length > 0
          ? '\n\n⭐ <b>Your Custom Whales:</b>\n' +
            user.customWhales.map((w, i) => `${i + 1}. <code>${w}</code>`).join('\n')
          : '';

      const msg = `🐋 <b>Curated Whales (Free):</b>\n\n${curatedList}${customList}`;
      await sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, msg);
      break;
    }

    case '/watch': {
      const address = args[0];
      if (!address) {
        await sendTelegram(
          env.TELEGRAM_BOT_TOKEN,
          chatId,
          '⚠️ Please provide a Solana address: <code>/watch 7xKXt...3mPq</code>'
        );
        break;
      }
      const res = await addCustomWhale(env, chatId, address);
      await sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, res.message);
      break;
    }

    case '/unwatch': {
      const address = args[0];
      if (!address) {
        await sendTelegram(
          env.TELEGRAM_BOT_TOKEN,
          chatId,
          '⚠️ Please provide a Solana address: <code>/unwatch 7xKXt...3mPq</code>'
        );
        break;
      }
      const res = await removeCustomWhale(env, chatId, address);
      await sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, res.message);
      break;
    }

    case '/subscribe': {
      const paymentWallet =
        env.PAYMENT_WALLET || '8bZ4a2w1Vj7m4k9x2P5n8b7c6V3x1M9p4L8k2F7eP9vL';
      const msg = [
        '💎 <b>Whale Alert Bot Pro Subscription</b>',
        '',
        'Track up to 20 custom whale wallets of your choice with zero-latency swap alerts.',
        '',
        `<b>Price:</b> ${PRO_PRICE_SOL} SOL / month (~$10)`,
        `<b>Send SOL To:</b> <code>${paymentWallet}</code>`,
        '',
        'After sending payment, type <code>/verify</code> to activate your Pro tier.',
      ].join('\n');
      await sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, msg);
      break;
    }

    case '/verify': {
      const res = await verifySolanaPayment(env, chatId);
      await sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, res.message);
      break;
    }

    default: {
      await sendTelegram(
        env.TELEGRAM_BOT_TOKEN,
        chatId,
        'Unknown command. Type /help to see all available commands.'
      );
      break;
    }
  }

  return new Response('OK');
}

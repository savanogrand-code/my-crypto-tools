import { TelegramCallbackQuery, Env } from '../types';

export async function handleCallbackQuery(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<Response> {
  const { id } = callbackQuery;

  // Answer callback query to dismiss loading spinner in Telegram
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: id,
      text: 'Opening Jupiter Swap...',
    }),
  });

  return new Response('OK');
}

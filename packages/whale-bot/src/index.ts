import { Env, TelegramUpdate } from './types';
import { handleHeliusWebhook } from './webhook/handler';
import { handleTelegramUpdate } from './telegram/bot';

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'whale-bot',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Helius Webhook Receiver
    if (url.pathname === '/webhook' && request.method === 'POST') {
      return handleHeliusWebhook(request, env);
    }

    // Telegram Bot Webhook Receiver
    if (url.pathname === '/telegram' && request.method === 'POST') {
      try {
        const update = (await request.json()) as TelegramUpdate;
        return handleTelegramUpdate(update, env);
      } catch (err) {
        console.error('Failed to parse Telegram update:', err);
        return new Response('Bad Request', { status: 400 });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;

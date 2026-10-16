/**
 * PermitGuard Pro Alerts — Cloudflare Worker Entry Point
 *
 * Handles:
 * - Cron-triggered approval monitoring (every 10 minutes)
 * - Telegram webhook for bot commands
 * - Health check endpoint
 */
import type { Env } from './types';
import { checkForNewApprovals } from './monitor';
import { handleTelegramWebhook } from './telegram';

export default {
  /**
   * HTTP fetch handler.
   * Routes requests to the appropriate handler based on path.
   */
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health' && request.method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'permit-guard-alerts',
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Telegram webhook
    if (url.pathname === '/telegram' && request.method === 'POST') {
      return handleTelegramWebhook(request, env);
    }

    // 404 for everything else
    return new Response('Not Found', { status: 404 });
  },

  /**
   * Cron trigger handler.
   * Runs the approval monitoring cycle on schedule.
   */
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    // Use waitUntil to ensure the worker doesn't terminate early
    ctx.waitUntil(checkForNewApprovals(env));
  },
} satisfies ExportedHandler<Env>;

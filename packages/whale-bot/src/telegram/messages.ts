import { ParsedSwap, BotUser } from '../types';
import { shortenAddress, formatAmount, formatUsd, timeAgo } from '../lib/format';
import { buildJupiterSwapUrl } from '../jupiter/swap';

export function formatWhaleAlert(
  swap: ParsedSwap,
  whaleLabel: string,
  referralAccount?: string
): {
  text: string;
  replyMarkup: {
    inline_keyboard: Array<Array<{ text: string; url?: string; callback_data?: string }>>;
  };
} {
  const solscanUrl = `https://solscan.io/tx/${swap.signature}`;
  const jupiterSwapUrl = buildJupiterSwapUrl(
    swap.inputMint,
    swap.outputMint,
    swap.inputAmount,
    referralAccount
  );

  const valueDisplay = swap.valueUsd ? `💵 <b>Estimated Value:</b> ~${formatUsd(swap.valueUsd)}\n` : '';

  const text = [
    '🐋 <b>SOLANA WHALE SWAP ALERT</b>',
    '',
    `👤 <b>Wallet:</b> <code>${shortenAddress(swap.walletAddress, 6)}</code> (${whaleLabel})`,
    `🔄 <b>Protocol:</b> ${swap.source}`,
    '',
    `🔴 <b>Sold:</b> ${formatAmount(swap.inputAmount, swap.inputDecimals)} ${swap.inputSymbol}`,
    `🟢 <b>Bought:</b> ${formatAmount(swap.outputAmount, swap.outputDecimals)} ${swap.outputSymbol}`,
    valueDisplay.trim(),
    '',
    `🕐 <b>Time:</b> ${timeAgo(swap.timestamp)}`,
    `🔗 <a href="${solscanUrl}">View Transaction on Solscan</a>`,
  ].filter(Boolean).join('\n');

  return {
    text,
    replyMarkup: {
      inline_keyboard: [
        [
          {
            text: `🔄 Copy Swap (${swap.inputSymbol} → ${swap.outputSymbol})`,
            url: jupiterSwapUrl,
          },
        ],
      ],
    },
  };
}

export function formatWelcome(): string {
  return [
    '🐋 <b>Welcome to Solana Whale Alert Bot!</b>',
    '',
    'Track high-conviction swaps from verified crypto whales, KOLs, and funds in real time on Solana.',
    '',
    '<b>Features:</b>',
    '• Real-time Helius webhook alerts',
    '• 1-Click "Copy Swap" buttons powered by Jupiter',
    '• Curated top 10 whale wallets free for all users',
    '• Pro tier: Add your own custom whale list (up to 20 wallets)',
    '',
    '<b>Quick Commands:</b>',
    '/list — View watched whales',
    '/watch &lt;solana_address&gt; — Add custom whale (Pro)',
    '/unwatch &lt;solana_address&gt; — Remove custom whale',
    '/subscribe — Unlock Pro tier ($10/month or 0.05 SOL)',
    '/status — Check account & stats',
    '/help — Commands reference',
  ].join('\n');
}

export function formatHelp(): string {
  return [
    '📋 <b>Whale Bot Commands:</b>',
    '',
    '/start — Overview & introduction',
    '/list — View all tracked whale wallets',
    '/watch &lt;address&gt; — Add custom whale (Pro required)',
    '/unwatch &lt;address&gt; — Remove custom whale',
    '/subscribe — Get Pro subscription payment instructions',
    '/status — View your subscription status and alert count',
    '/help — Show this help message',
  ].join('\n');
}

export function formatStatus(user: BotUser | null): string {
  if (!user) {
    return '❌ Account not found. Type /start to initialize.';
  }

  const now = Math.floor(Date.now() / 1000);
  const isPaid = user.isPaid && user.expiresAt && user.expiresAt > now;
  const statusBadge = isPaid ? '✅ Pro Active' : '🆓 Free Tier';
  const expiresText = isPaid && user.expiresAt
    ? `\n<b>Expires:</b> ${new Date(user.expiresAt * 1000).toLocaleDateString()}`
    : '';

  return [
    `👤 <b>Your Account Status:</b> ${statusBadge}`,
    expiresText,
    `<b>Total Alerts Received:</b> ${user.alertCount || 0}`,
    `<b>Custom Whales Tracked:</b> ${user.customWhales?.length || 0}/20`,
    '',
    isPaid
      ? '🚀 Pro tier active. You can add up to 20 custom wallets with /watch.'
      : '💡 Want to track your own whale list? Type /subscribe to upgrade.',
  ].filter(Boolean).join('\n');
}

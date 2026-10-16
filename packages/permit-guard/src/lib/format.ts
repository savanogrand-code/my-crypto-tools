import { formatUnits } from 'viem';
import { UNLIMITED_THRESHOLD } from '@/config/constants';

export function truncateAddress(address: string, start = 6, end = 4): string {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatAllowance(
  amount: bigint,
  decimals: number,
  isUnlimited: boolean,
  precision = 4
): string {
  if (isUnlimited || amount >= UNLIMITED_THRESHOLD) {
    return 'Unlimited';
  }
  if (amount === 0n) {
    return '0';
  }

  try {
    const formatted = formatUnits(amount, decimals);
    const [intPart, decPart] = formatted.split('.');
    if (!decPart) return Number(intPart).toLocaleString();
    const truncatedDec = decPart.slice(0, precision);
    return `${Number(intPart).toLocaleString()}.${truncatedDec}`;
  } catch {
    return amount.toString();
  }
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function timeAgo(timestampSeconds: number): string {
  const diffSec = Math.floor(Date.now() / 1000 - timestampSeconds);
  if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

export function formatExpiry(timestampSeconds?: number): string {
  if (!timestampSeconds) return 'Never';
  const now = Math.floor(Date.now() / 1000);
  if (timestampSeconds <= now) return 'Expired';
  const diffDays = Math.ceil((timestampSeconds - now) / 86400);
  if (diffDays <= 1) return '< 1 day remaining';
  return `${diffDays} days remaining`;
}

import { describe, it, expect } from 'vitest';
import { truncateAddress, formatAllowance, formatUsd, timeAgo } from '@/lib/format';
import { MAX_UINT256 } from '@/config/constants';

describe('Formatting Utilities', () => {
  it('truncates Ethereum addresses correctly', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    expect(truncateAddress(address)).toBe('0x1234...5678');
  });

  it('formats unlimited allowance as Unlimited', () => {
    expect(formatAllowance(MAX_UINT256, 18, true)).toBe('Unlimited');
  });

  it('formats zero allowance correctly', () => {
    expect(formatAllowance(0n, 6, false)).toBe('0');
  });

  it('formats integer ERC-20 token allowance without redundant trailing zeros', () => {
    const amount = 1500000000n; // 1,500 USDC (6 decimals)
    expect(formatAllowance(amount, 6, false)).toBe('1,500');
  });

  it('formats fractional ERC-20 token allowance with decimals', () => {
    const amount = 1500500000n; // 1,500.5 USDC
    expect(formatAllowance(amount, 6, false)).toBe('1,500.5');
  });

  it('formats USD amounts', () => {
    expect(formatUsd(1234.56)).toBe('$1,234.56');
  });

  it('formats relative time ago', () => {
    const nowSec = Math.floor(Date.now() / 1000);
    expect(timeAgo(nowSec - 10)).toBe('10s ago');
    expect(timeAgo(nowSec - 120)).toBe('2m ago');
  });
});

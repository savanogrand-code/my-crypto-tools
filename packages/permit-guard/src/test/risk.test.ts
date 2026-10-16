import { describe, it, expect } from 'vitest';
import { computeRiskLevel, getRiskBadgeStyles, getRiskExplanation } from '@/lib/risk';
import { Approval } from '@/types';
import { MAX_UINT256 } from '@/config/constants';

describe('Risk Calculation Engine', () => {
  it('identifies unverified unlimited ERC20 approval as CRITICAL', () => {
    const approval: Partial<Approval> = {
      type: 'ERC20',
      allowance: MAX_UINT256,
      isUnlimited: true,
      spenderVerified: false,
    };
    expect(computeRiskLevel(approval)).toBe('CRITICAL');
  });

  it('identifies verified unlimited ERC20 approval as HIGH', () => {
    const approval: Partial<Approval> = {
      type: 'ERC20',
      allowance: MAX_UINT256,
      isUnlimited: true,
      spenderVerified: true,
    };
    expect(computeRiskLevel(approval)).toBe('HIGH');
  });

  it('identifies unverified NFT approvalForAll as CRITICAL', () => {
    const approval: Partial<Approval> = {
      type: 'ERC721',
      isApprovedForAll: true,
      spenderVerified: false,
    };
    expect(computeRiskLevel(approval)).toBe('CRITICAL');
  });

  it('identifies verified NFT approvalForAll as HIGH', () => {
    const approval: Partial<Approval> = {
      type: 'ERC721',
      isApprovedForAll: true,
      spenderVerified: true,
    };
    expect(computeRiskLevel(approval)).toBe('HIGH');
  });

  it('identifies expired Permit2 approval as LOW', () => {
    const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const approval: Partial<Approval> = {
      type: 'PERMIT2',
      allowance: 1000n,
      expiration: pastTime,
    };
    expect(computeRiskLevel(approval)).toBe('LOW');
  });

  it('identifies long-dated Permit2 approval (>30 days) as MEDIUM', () => {
    const farFuture = Math.floor(Date.now() / 1000) + 40 * 86400; // 40 days
    const approval: Partial<Approval> = {
      type: 'PERMIT2',
      allowance: 1000n,
      expiration: farFuture,
    };
    expect(computeRiskLevel(approval)).toBe('MEDIUM');
  });

  it('identifies small limited allowance as LOW', () => {
    const approval: Partial<Approval> = {
      type: 'ERC20',
      allowance: 50n * 10n ** 6n, // 50 USDC
      isUnlimited: false,
      spenderVerified: true,
    };
    expect(computeRiskLevel(approval)).toBe('LOW');
  });
});

describe('Risk Badges & Explanations', () => {
  it('returns appropriate pulse styles for CRITICAL', () => {
    const styles = getRiskBadgeStyles('CRITICAL');
    expect(styles.pulse).toBe(true);
    expect(styles.text).toContain('rose');
  });

  it('returns valid explanations for all risk tiers', () => {
    const mockApproval: Approval = {
      id: 'test',
      type: 'ERC20',
      chainId: 1,
      tokenAddress: '0x0000000000000000000000000000000000000001',
      tokenSymbol: 'USDC',
      tokenName: 'USD Coin',
      tokenDecimals: 6,
      spenderAddress: '0x0000000000000000000000000000000000000002',
      allowance: MAX_UINT256,
      isUnlimited: true,
      riskLevel: 'CRITICAL',
    };
    const exp = getRiskExplanation(mockApproval);
    expect(exp).toContain('drain');
  });
});

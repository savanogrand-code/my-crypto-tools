import { Approval, RiskLevel } from '@/types';
import { UNLIMITED_THRESHOLD } from '@/config/constants';

export function computeRiskLevel(approval: Partial<Approval>): RiskLevel {
  const isUnlimited = approval.isUnlimited || (approval.allowance !== undefined && approval.allowance >= UNLIMITED_THRESHOLD);
  const isSpenderVerified = approval.spenderVerified ?? false;

  // NFT approval for all gives unrestricted access to entire collection
  if ((approval.type === 'ERC721' || approval.type === 'ERC1155') && approval.isApprovedForAll) {
    if (!isSpenderVerified) return 'CRITICAL';
    return 'HIGH';
  }

  // CRITICAL: Unlimited approval to an unknown or unverified contract
  if (isUnlimited && !isSpenderVerified) {
    return 'CRITICAL';
  }

  // HIGH: Unlimited approval to a verified contract (still vulnerable to contract exploit/migration)
  if (isUnlimited) {
    return 'HIGH';
  }

  // Permit2 specific risk calculation
  if (approval.type === 'PERMIT2') {
    const now = Math.floor(Date.now() / 1000);
    const expiration = approval.expiration ?? 0;
    
    // Expired Permit2 allowances are zero-risk
    if (expiration > 0 && expiration <= now) {
      return 'LOW';
    }

    // Permit2 with > 30 day expiration window
    if (expiration > now + 30 * 86400) {
      return 'MEDIUM';
    }
  }

  // Finite allowance: if allowance is large (> 1,000,000 units with 18 decimals)
  if (approval.allowance && approval.allowance > 1_000_000n * 10n ** 18n) {
    return 'MEDIUM';
  }

  return 'LOW';
}

export function getRiskBadgeStyles(level: RiskLevel): {
  bg: string;
  text: string;
  border: string;
  pulse?: boolean;
} {
  switch (level) {
    case 'CRITICAL':
      return {
        bg: 'bg-rose-950/80',
        text: 'text-rose-300',
        border: 'border-rose-500/50',
        pulse: true,
      };
    case 'HIGH':
      return {
        bg: 'bg-red-950/60',
        text: 'text-red-300',
        border: 'border-red-500/40',
      };
    case 'MEDIUM':
      return {
        bg: 'bg-amber-950/60',
        text: 'text-amber-300',
        border: 'border-amber-500/40',
      };
    case 'LOW':
      return {
        bg: 'bg-emerald-950/60',
        text: 'text-emerald-300',
        border: 'border-emerald-500/40',
      };
  }
}

export function getRiskExplanation(approval: Approval): string {
  if (approval.riskLevel === 'CRITICAL') {
    if (approval.type === 'ERC721' || approval.type === 'ERC1155') {
      return 'Full collection operator rights granted to an unverified contract or address.';
    }
    return 'Unlimited allowance granted to an unverified spender. Your entire token balance can be drained at any time.';
  }
  if (approval.riskLevel === 'HIGH') {
    if (approval.type === 'ERC721' || approval.type === 'ERC1155') {
      return 'Operator has permission to transfer any NFT in this collection on your behalf.';
    }
    return 'Unlimited token allowance. While the spender contract is known, smart contract hacks or upgrades can still compromise your tokens.';
  }
  if (approval.riskLevel === 'MEDIUM') {
    if (approval.type === 'PERMIT2') {
      return 'Permit2 allowance with long-dated expiration window (>30 days).';
    }
    return 'Large token allowance granted. Higher financial exposure in the event of an exploit.';
  }
  return 'Limited token allowance or short-lived Permit2 authorization. Low financial exposure.';
}

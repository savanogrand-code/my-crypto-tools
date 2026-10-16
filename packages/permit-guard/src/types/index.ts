export type ApprovalType = 'ERC20' | 'PERMIT2' | 'ERC721' | 'ERC1155';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Approval {
  id: string; // unique key for React rendering: e.g. `${chainId}-${tokenAddress}-${spenderAddress}-${type}`
  type: ApprovalType;
  chainId: number;
  tokenAddress: `0x${string}`;
  tokenSymbol: string;
  tokenName: string;
  tokenDecimals: number;
  tokenLogoUrl?: string;
  spenderAddress: `0x${string}`;
  spenderLabel?: string; // Protocol name if known
  spenderVerified?: boolean;
  allowance: bigint; // Raw amount or MaxUint256 for unlimited
  isUnlimited: boolean;
  riskLevel: RiskLevel;
  // Permit2 specific
  expiration?: number; // Unix timestamp in seconds
  nonce?: number;
  // NFT specific
  isApprovedForAll?: boolean;
  lastUpdatedBlock?: bigint;
}

export interface RevokeAction {
  approval: Approval;
  type: 'erc20_revoke' | 'permit2_lockdown' | 'nft_revoke';
}

export interface WalletRiskSummary {
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalCount: number;
}

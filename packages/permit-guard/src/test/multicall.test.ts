import { describe, it, expect } from 'vitest';
import { buildSingleRevokeCall, buildBatchRevokeCalls } from '@/lib/multicall';
import { Approval } from '@/types';
import { PERMIT2_ADDRESS, DEFAULT_TIP_RECIPIENT } from '@/config/constants';

describe('Multicall Revoke Builder', () => {
  const mockErc20Approval: Approval = {
    id: '1-0xa0b8-0x1111-ERC20',
    type: 'ERC20',
    chainId: 1,
    tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    tokenSymbol: 'USDC',
    tokenName: 'USD Coin',
    tokenDecimals: 6,
    spenderAddress: '0x1111111254eeb25477b68fb85ed929f73a960582',
    allowance: 1000000n,
    isUnlimited: false,
    riskLevel: 'LOW',
  };

  const mockPermit2Approval: Approval = {
    id: '1-0xa0b8-0x1111-PERMIT2',
    type: 'PERMIT2',
    chainId: 1,
    tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    tokenSymbol: 'USDC',
    tokenName: 'USD Coin',
    tokenDecimals: 6,
    spenderAddress: '0x1111111254eeb25477b68fb85ed929f73a960582',
    allowance: 1000000n,
    isUnlimited: false,
    riskLevel: 'LOW',
    expiration: 1800000000,
    nonce: 1,
  };

  it('builds ERC20 approve(0) single call', () => {
    const call = buildSingleRevokeCall(mockErc20Approval);
    expect(call.target).toBe(mockErc20Approval.tokenAddress);
    expect(call.allowFailure).toBe(false);
    expect(call.value).toBe(0n);
    expect(call.callData).toBeDefined();
  });

  it('builds Permit2 lockdown call targeting canonical Permit2 address', () => {
    const call = buildSingleRevokeCall(mockPermit2Approval);
    expect(call.target).toBe(PERMIT2_ADDRESS);
    expect(call.allowFailure).toBe(false);
    expect(call.value).toBe(0n);
  });

  it('builds batch revoke with Multicall3 tip included', () => {
    const tipAmount = 300000000000000n; // 0.0003 ETH
    const { calls, totalValue } = buildBatchRevokeCalls(
      [mockErc20Approval, mockPermit2Approval],
      { tipAmount }
    );

    expect(calls.length).toBe(3); // 2 revokes + 1 tip
    expect(totalValue).toBe(tipAmount);

    const tipCall = calls[2];
    expect(tipCall.target).toBe(DEFAULT_TIP_RECIPIENT);
    expect(tipCall.allowFailure).toBe(true); // Tip must allow failure
    expect(tipCall.value).toBe(tipAmount);
  });
});

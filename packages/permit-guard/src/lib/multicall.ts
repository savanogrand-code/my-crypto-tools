import { encodeFunctionData } from 'viem';
import { Approval } from '@/types';
import { erc20Abi } from '@/abis/erc20';
import { permit2Abi } from '@/abis/permit2';
import { erc721Abi } from '@/abis/erc721';
import { erc1155Abi } from '@/abis/erc1155';
import { PERMIT2_ADDRESS, DEFAULT_TIP_RECIPIENT } from '@/config/constants';

export interface Multicall3Call {
  target: `0x${string}`;
  allowFailure: boolean;
  value: bigint;
  callData: `0x${string}`;
}

export function buildSingleRevokeCall(approval: Approval): Multicall3Call {
  if (approval.type === 'ERC20') {
    return {
      target: approval.tokenAddress,
      allowFailure: false,
      value: 0n,
      callData: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [approval.spenderAddress, 0n],
      }),
    };
  }

  if (approval.type === 'PERMIT2') {
    // Permit2 lockdown to permanently revoke allowances and invalidate active permits
    return {
      target: PERMIT2_ADDRESS,
      allowFailure: false,
      value: 0n,
      callData: encodeFunctionData({
        abi: permit2Abi,
        functionName: 'lockdown',
        args: [[{ token: approval.tokenAddress, spender: approval.spenderAddress }]],
      }),
    };
  }

  if (approval.type === 'ERC721') {
    return {
      target: approval.tokenAddress,
      allowFailure: false,
      value: 0n,
      callData: encodeFunctionData({
        abi: erc721Abi,
        functionName: 'setApprovalForAll',
        args: [approval.spenderAddress, false],
      }),
    };
  }

  // ERC1155
  return {
    target: approval.tokenAddress,
    allowFailure: false,
    value: 0n,
    callData: encodeFunctionData({
      abi: erc1155Abi,
      functionName: 'setApprovalForAll',
      args: [approval.spenderAddress, false],
    }),
  };
}

export function buildBatchRevokeCalls(
  approvals: Approval[],
  options?: {
    tipAmount?: bigint;
    tipRecipient?: `0x${string}`;
  }
): {
  calls: Multicall3Call[];
  totalValue: bigint;
} {
  const calls: Multicall3Call[] = approvals.map((approval) => buildSingleRevokeCall(approval));
  let totalValue = 0n;

  // Add optional tip call if specified
  if (options?.tipAmount && options.tipAmount > 0n) {
    const recipient = options.tipRecipient || DEFAULT_TIP_RECIPIENT;
    calls.push({
      target: recipient,
      allowFailure: true, // Tip failure must NEVER block revokes
      value: options.tipAmount,
      callData: '0x',
    });
    totalValue += options.tipAmount;
  }

  return { calls, totalValue };
}

import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { Approval } from '@/types';
import { multicall3Abi } from '@/abis/multicall3';
import { erc20Abi } from '@/abis/erc20';
import { permit2Abi } from '@/abis/permit2';
import { erc721Abi } from '@/abis/erc721';
import { erc1155Abi } from '@/abis/erc1155';
import { MULTICALL3_ADDRESS, PERMIT2_ADDRESS } from '@/config/constants';
import { buildBatchRevokeCalls } from '@/lib/multicall';

export function useBatchRevoke() {
  const { writeContractAsync: writeContract } = useWriteContract();

  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Single approval revoke
  const revokeSingle = async (approval: Approval) => {
    setIsPending(true);
    setError(null);
    setTxHash(null);

    try {
      let hash: `0x${string}`;

      if (approval.type === 'ERC20') {
        hash = await writeContract({
          address: approval.tokenAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [approval.spenderAddress, 0n],
        });
      } else if (approval.type === 'PERMIT2') {
        hash = await writeContract({
          address: PERMIT2_ADDRESS,
          abi: permit2Abi,
          functionName: 'lockdown',
          args: [[{ token: approval.tokenAddress, spender: approval.spenderAddress }]],
        });
      } else if (approval.type === 'ERC721') {
        hash = await writeContract({
          address: approval.tokenAddress,
          abi: erc721Abi,
          functionName: 'setApprovalForAll',
          args: [approval.spenderAddress, false],
        });
      } else {
        hash = await writeContract({
          address: approval.tokenAddress,
          abi: erc1155Abi,
          functionName: 'setApprovalForAll',
          args: [approval.spenderAddress, false],
        });
      }

      setTxHash(hash);
      return hash;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsPending(false);
    }
  };

  // Batch revoke multiple approvals via Multicall3 with optional tip
  const revokeBatch = async (
    approvals: Approval[],
    options?: {
      tipAmount?: bigint;
      tipRecipient?: `0x${string}`;
    }
  ) => {
    if (approvals.length === 0) return null;

    // If only 1 approval selected and no tip, do single revoke
    if (approvals.length === 1 && (!options?.tipAmount || options.tipAmount === 0n)) {
      return revokeSingle(approvals[0]);
    }

    setIsPending(true);
    setError(null);
    setTxHash(null);

    try {
      const { calls, totalValue } = buildBatchRevokeCalls(approvals, options);

      const hash = await writeContract({
        address: MULTICALL3_ADDRESS,
        abi: multicall3Abi,
        functionName: 'aggregate3Value',
        args: [calls],
        value: totalValue,
      });

      setTxHash(hash);
      return hash;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsPending(false);
    }
  };

  return {
    revokeSingle,
    revokeBatch,
    isPending,
    txHash,
    error,
    reset: () => {
      setTxHash(null);
      setError(null);
    },
  };
}

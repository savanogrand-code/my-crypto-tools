import { useAccount, usePublicClient } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { Approval, WalletRiskSummary, RiskLevel } from '@/types';
import {
  fetchERC20Approvals,
  fetchPermit2Approvals,
  fetchNFTApprovals,
} from '@/lib/approvals';

const RISK_SORT_ORDER: Record<RiskLevel, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export function useAllApprovals() {
  const { address, chainId, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const query = useQuery({
    queryKey: ['approvals', address, chainId],
    queryFn: async (): Promise<Approval[]> => {
      if (!address || !chainId || !publicClient) return [];

      // Fetch all approval types concurrently
      const [erc20s, permit2s, nfts] = await Promise.all([
        fetchERC20Approvals(publicClient, address, chainId),
        fetchPermit2Approvals(publicClient, address, chainId),
        fetchNFTApprovals(publicClient, address, chainId),
      ]);

      const all = [...erc20s, ...permit2s, ...nfts];

      // Sort with highest risk first
      return all.sort(
        (a, b) => RISK_SORT_ORDER[a.riskLevel] - RISK_SORT_ORDER[b.riskLevel]
      );
    },
    enabled: isConnected && !!address && !!chainId && !!publicClient,
    staleTime: 30_000, // 30 seconds cache
    refetchOnWindowFocus: false,
  });

  const approvals = query.data || [];

  const riskSummary: WalletRiskSummary = approvals.reduce(
    (acc, curr) => {
      if (curr.riskLevel === 'CRITICAL') acc.criticalCount++;
      else if (curr.riskLevel === 'HIGH') acc.highCount++;
      else if (curr.riskLevel === 'MEDIUM') acc.mediumCount++;
      else if (curr.riskLevel === 'LOW') acc.lowCount++;
      acc.totalCount++;
      return acc;
    },
    { criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, totalCount: 0 }
  );

  return {
    approvals,
    riskSummary,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

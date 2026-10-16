import React, { useState } from 'react';
import { WagmiProvider, useAccount } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from '@/config/wagmi';
import { Layout } from '@/components/layout/Layout';
import { ConnectPrompt } from '@/components/wallet/ConnectPrompt';
import { WalletInfo } from '@/components/wallet/WalletInfo';
import { ApprovalTable } from '@/components/dashboard/ApprovalTable';
import { BatchRevokeBar } from '@/components/dashboard/BatchRevokeBar';
import { TableSkeleton, SummarySkeleton } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAllApprovals } from '@/hooks/useAllApprovals';
import { useBatchRevoke } from '@/hooks/useBatchRevoke';
import { Approval } from '@/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const DashboardContent: React.FC = () => {
  const { isConnected } = useAccount();
  const { approvals, riskSummary, isLoading, isRefetching, isError, refetch } =
    useAllApprovals();

  const { revokeSingle, revokeBatch, isPending, txHash } = useBatchRevoke();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [revokingId, setRevokingId] = useState<string | null>(null);

  if (!isConnected) {
    return <ConnectPrompt />;
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (ids: string[]) => {
    setSelectedIds(new Set(ids));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleSelectAllHighRisk = () => {
    const highRiskIds = approvals
      .filter((a) => a.riskLevel === 'CRITICAL' || a.riskLevel === 'HIGH')
      .map((a) => a.id);
    setSelectedIds(new Set(highRiskIds));
  };

  const handleSingleRevoke = async (approval: Approval) => {
    setRevokingId(approval.id);
    try {
      await revokeSingle(approval);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(approval.id);
        return next;
      });
      // Trigger background refetch
      setTimeout(() => refetch(), 3000);
    } finally {
      setRevokingId(null);
    }
  };

  const handleBatchRevoke = async (tipAmount: bigint) => {
    const selectedApprovals = approvals.filter((a) => selectedIds.has(a.id));
    if (selectedApprovals.length === 0) return;

    await revokeBatch(selectedApprovals, { tipAmount });
    setSelectedIds(new Set());
    setTimeout(() => refetch(), 4000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Pro Telegram Alert Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900/90 to-purple-950/70 border border-indigo-500/30 shadow-lg gap-3">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🔔</div>
          <div>
            <div className="text-sm font-semibold text-indigo-200">
              PermitGuard Pro: Real-time Wallet Protection
            </div>
            <div className="text-xs text-slate-400">
              Receive instant Telegram alerts whenever your wallet signs new approvals or high-risk permits.
            </div>
          </div>
        </div>
        <a
          href="https://t.me/PermitGuardBot"
          target="_blank"
          rel="noopener noreferrer"
          className="whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md active:scale-95"
        >
          Enable Alerts ($5/mo) ↗
        </a>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <SummarySkeleton />
          <TableSkeleton />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <WalletInfo
            summary={riskSummary}
            approvals={approvals}
            onSelectAllHighRisk={handleSelectAllHighRisk}
            onRefresh={() => refetch()}
            isRefreshing={isRefetching}
          />

          <ApprovalTable
            approvals={approvals}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onRevoke={handleSingleRevoke}
            revokingId={revokingId}
          />
        </>
      )}

      {/* Floating Batch Revoke Bar */}
      <BatchRevokeBar
        selectedCount={selectedIds.size}
        onRevokeBatch={handleBatchRevoke}
        onClear={handleClearSelection}
        isPending={isPending}
        txHash={txHash}
      />
    </div>
  );
};

export function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#4f46e5', // indigo-600
            accentColorForeground: 'white',
            borderRadius: 'large',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
          <Layout>
            <DashboardContent />
          </Layout>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

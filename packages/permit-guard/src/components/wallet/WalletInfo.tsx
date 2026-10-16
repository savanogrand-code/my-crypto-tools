import React from 'react';
import { useAccount } from 'wagmi';
import { WalletRiskSummary, Approval } from '@/types';
import { truncateAddress } from '@/lib/format';
import { chainNames } from '@/config/chains';
import { ShareRiskScore } from '@/components/share/ShareRiskScore';

interface WalletInfoProps {
  summary: WalletRiskSummary;
  approvals: Approval[];
  onSelectAllHighRisk: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const WalletInfo: React.FC<WalletInfoProps> = ({
  summary,
  onSelectAllHighRisk,
  onRefresh,
  isRefreshing,
}) => {
  const { address, chainId } = useAccount();
  const chainName = (chainId && chainNames[chainId]) || 'Unknown Chain';
  const highRiskTotal = summary.criticalCount + summary.highCount;

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 backdrop-blur shadow-lg space-y-4">
      {/* Top row: Address, Network, Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
            🛡️
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-semibold text-slate-100">
                {address ? truncateAddress(address, 8, 6) : 'Not Connected'}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                {chainName}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Active approvals audit & instant permissions revoker
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <ShareRiskScore summary={summary} />
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Refresh Approvals"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-950/60 rounded-xl border border-rose-900/30">
          <div className="text-xs font-medium text-rose-400 flex items-center justify-between">
            <span>Critical Risk</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <div className="mt-1 text-2xl font-bold text-rose-200">{summary.criticalCount}</div>
          <div className="text-[11px] text-slate-500">Unverified contracts</div>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-red-900/30">
          <div className="text-xs font-medium text-red-400 flex items-center justify-between">
            <span>High Risk</span>
            <span className="w-2 h-2 rounded-full bg-red-500" />
          </div>
          <div className="mt-1 text-2xl font-bold text-red-200">{summary.highCount}</div>
          <div className="text-[11px] text-slate-500">Unlimited approvals</div>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-amber-900/30">
          <div className="text-xs font-medium text-amber-400">Medium Risk</div>
          <div className="mt-1 text-2xl font-bold text-amber-200">{summary.mediumCount}</div>
          <div className="text-[11px] text-slate-500">Large / long expiry</div>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-emerald-900/30">
          <div className="text-xs font-medium text-emerald-400">Low Risk</div>
          <div className="mt-1 text-2xl font-bold text-emerald-200">{summary.lowCount}</div>
          <div className="text-[11px] text-slate-500">Safe / limited allowance</div>
        </div>
      </div>

      {/* Quick Action banner if high risk found */}
      {highRiskTotal > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-rose-950/40 via-red-950/20 to-transparent border border-rose-900/40">
          <div className="text-xs text-rose-200 flex items-center space-x-2">
            <span>⚠️</span>
            <span>
              <strong>{highRiskTotal} high-risk approval(s)</strong> expose your wallet to drainer attacks.
            </span>
          </div>
          <button
            onClick={onSelectAllHighRisk}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md active:scale-95"
          >
            Select All High Risk
          </button>
        </div>
      )}
    </div>
  );
};

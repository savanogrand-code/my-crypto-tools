import React, { useState, useMemo } from 'react';
import { Approval, ApprovalType, RiskLevel } from '@/types';
import { ApprovalRow } from './ApprovalRow';

interface ApprovalTableProps {
  approvals: Approval[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onClearSelection: () => void;
  onRevoke: (approval: Approval) => Promise<unknown>;
  revokingId: string | null;
}

export const ApprovalTable: React.FC<ApprovalTableProps> = ({
  approvals,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onRevoke,
  revokingId,
}) => {
  const [typeFilter, setTypeFilter] = useState<'ALL' | ApprovalType>('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | RiskLevel>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter approvals based on search & filters
  const filteredApprovals = useMemo(() => {
    return approvals.filter((item) => {
      // Type filter
      if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;

      // Risk filter
      if (riskFilter !== 'ALL' && item.riskLevel !== riskFilter) return false;

      // Search query (token symbol, name, spender)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchSymbol = item.tokenSymbol.toLowerCase().includes(query);
        const matchName = item.tokenName.toLowerCase().includes(query);
        const matchSpender = item.spenderAddress.toLowerCase().includes(query);
        const matchLabel = item.spenderLabel?.toLowerCase().includes(query) ?? false;
        if (!matchSymbol && !matchName && !matchSpender && !matchLabel) return false;
      }

      return true;
    });
  }, [approvals, typeFilter, riskFilter, searchQuery]);

  const allFilteredSelected =
    filteredApprovals.length > 0 &&
    filteredApprovals.every((item) => selectedIds.has(item.id));

  const handleMasterCheckbox = () => {
    if (allFilteredSelected) {
      onClearSelection();
    } else {
      onSelectAll(filteredApprovals.map((item) => item.id));
    }
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur shadow-xl space-y-4">
      {/* Controls: Search & Filters */}
      <div className="p-4 border-b border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search token or spender address..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-medium">
            {(['ALL', 'ERC20', 'PERMIT2', 'ERC721'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  typeFilter === type
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type === 'ALL' ? 'All Types' : type}
              </button>
            ))}
          </div>

          {/* Risk Filter */}
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-medium">
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((risk) => (
              <button
                key={risk}
                onClick={() => setRiskFilter(risk)}
                className={`px-2 py-1 rounded-md transition-colors ${
                  riskFilter === risk
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {risk === 'ALL' ? 'All Risks' : risk}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="p-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={handleMasterCheckbox}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="p-4">Token / Asset</th>
              <th className="p-4">Authorized Spender</th>
              <th className="p-4">Allowance</th>
              <th className="p-4">Risk Level</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredApprovals.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-12 text-slate-400">
                  <div className="space-y-2">
                    <div className="text-3xl">🎉</div>
                    <div className="font-semibold text-slate-200">No matching approvals found</div>
                    <div className="text-xs text-slate-500">
                      {approvals.length === 0
                        ? 'Your wallet has zero active token approvals detected on this chain.'
                        : 'No approvals match your current search and filter criteria.'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredApprovals.map((approval) => (
                <ApprovalRow
                  key={approval.id}
                  approval={approval}
                  isSelected={selectedIds.has(approval.id)}
                  onToggleSelect={onToggleSelect}
                  onRevoke={onRevoke}
                  isRevoking={revokingId === approval.id}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing {filteredApprovals.length} of {approvals.length} total approvals
        </div>
        {selectedIds.size > 0 && (
          <div className="text-indigo-400 font-medium">
            {selectedIds.size} approval(s) selected
          </div>
        )}
      </div>
    </div>
  );
};

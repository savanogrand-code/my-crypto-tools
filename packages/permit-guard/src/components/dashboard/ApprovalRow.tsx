import React, { useState } from 'react';
import { Approval } from '@/types';
import { truncateAddress, formatAllowance, formatExpiry } from '@/lib/format';
import { chainExplorers } from '@/config/chains';
import { RiskBadge } from './RiskBadge';

interface ApprovalRowProps {
  approval: Approval;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onRevoke: (approval: Approval) => Promise<unknown>;
  isRevoking: boolean;
}

export const ApprovalRow: React.FC<ApprovalRowProps> = ({
  approval,
  isSelected,
  onToggleSelect,
  onRevoke,
  isRevoking,
}) => {
  const [copied, setCopied] = useState(false);
  const explorerUrl = chainExplorers[approval.chainId] || 'https://etherscan.io';

  const copyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(approval.spenderAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedAllowance =
    approval.type === 'ERC721' || approval.type === 'ERC1155'
      ? 'All Tokens'
      : formatAllowance(approval.allowance, approval.tokenDecimals, approval.isUnlimited);

  const typeColorMap: Record<string, string> = {
    ERC20: 'bg-blue-950/60 text-blue-300 border-blue-800/40',
    PERMIT2: 'bg-purple-950/60 text-purple-300 border-purple-800/40',
    ERC721: 'bg-pink-950/60 text-pink-300 border-pink-800/40',
    ERC1155: 'bg-teal-950/60 text-teal-300 border-teal-800/40',
  };

  return (
    <tr
      className={`border-b border-slate-800/60 transition-colors hover:bg-slate-900/40 ${
        isSelected ? 'bg-indigo-950/20' : ''
      }`}
    >
      {/* Checkbox */}
      <td className="p-4 w-12 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(approval.id)}
          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
      </td>

      {/* Asset / Token */}
      <td className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300 border border-slate-700">
            {approval.tokenSymbol.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-sm text-slate-100">{approval.tokenSymbol}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
                  typeColorMap[approval.type] || 'bg-slate-800 text-slate-300'
                }`}
              >
                {approval.type}
              </span>
            </div>
            <div className="text-xs text-slate-400 truncate max-w-[140px]">{approval.tokenName}</div>
          </div>
        </div>
      </td>

      {/* Spender */}
      <td className="p-4">
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="text-sm font-medium text-slate-200">
              {approval.spenderLabel || truncateAddress(approval.spenderAddress)}
            </span>
            {approval.spenderVerified && (
              <span className="text-emerald-400 text-xs" title="Verified Protocol">
                ✓
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono mt-0.5">
            <span>{truncateAddress(approval.spenderAddress, 6, 4)}</span>
            <button
              onClick={copyAddress}
              className="hover:text-slate-300 transition-colors"
              title="Copy spender address"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <span>•</span>
            <a
              href={`${explorerUrl}/address/${approval.spenderAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-400 transition-colors"
              title="View on block explorer"
            >
              Explorer ↗
            </a>
          </div>
        </div>
      </td>

      {/* Allowance */}
      <td className="p-4">
        <div>
          <span
            className={`font-mono text-sm font-semibold ${
              approval.isUnlimited ? 'text-rose-400' : 'text-slate-200'
            }`}
          >
            {formattedAllowance}
          </span>
          {approval.type === 'PERMIT2' && approval.expiration && (
            <div className="text-[11px] text-slate-500 mt-0.5">
              Expires: {formatExpiry(approval.expiration)}
            </div>
          )}
        </div>
      </td>

      {/* Risk Level */}
      <td className="p-4">
        <RiskBadge level={approval.riskLevel} approval={approval} />
      </td>

      {/* Actions */}
      <td className="p-4 text-right">
        <button
          onClick={() => onRevoke(approval)}
          disabled={isRevoking}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/90 hover:bg-rose-500 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          {isRevoking ? 'Revoking...' : 'Revoke'}
        </button>
      </td>
    </tr>
  );
};

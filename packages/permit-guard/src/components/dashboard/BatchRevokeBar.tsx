import React, { useState } from 'react';
import { DEFAULT_TIP_AMOUNT } from '@/config/constants';

interface BatchRevokeBarProps {
  selectedCount: number;
  onRevokeBatch: (tipAmount: bigint) => Promise<unknown>;
  onClear: () => void;
  isPending: boolean;
  txHash: `0x${string}` | null;
}

export const BatchRevokeBar: React.FC<BatchRevokeBarProps> = ({
  selectedCount,
  onRevokeBatch,
  onClear,
  isPending,
  txHash,
}) => {
  const [includeTip, setIncludeTip] = useState(true);
  const [tipTier, setTipTier] = useState<'LOW' | 'MED' | 'HIGH'>('LOW');

  if (selectedCount === 0 && !isPending && !txHash) {
    return null;
  }

  const tipAmounts = {
    LOW: DEFAULT_TIP_AMOUNT, // 0.0003 ETH
    MED: 500000000000000n, // 0.0005 ETH
    HIGH: 1000000000000000n, // 0.001 ETH
  };

  const currentTipWei = includeTip ? tipAmounts[tipTier] : 0n;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-900/95 border border-indigo-500/50 backdrop-blur-xl rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Info & Tip selector */}
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300">
            {selectedCount}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100">
              {selectedCount} Approval{selectedCount !== 1 ? 's' : ''} Selected
            </div>
            {/* Tip toggle & tier selection */}
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTip}
                  onChange={(e) => setIncludeTip(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-400 w-3.5 h-3.5"
                />
                <span>Dev Tip</span>
              </label>

              {includeTip && (
                <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-[10px]">
                  <button
                    onClick={() => setTipTier('LOW')}
                    className={`px-1.5 py-0.5 rounded ${
                      tipTier === 'LOW' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    0.0003
                  </button>
                  <button
                    onClick={() => setTipTier('MED')}
                    className={`px-1.5 py-0.5 rounded ${
                      tipTier === 'MED' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    0.0005
                  </button>
                  <button
                    onClick={() => setTipTier('HIGH')}
                    className={`px-1.5 py-0.5 rounded ${
                      tipTier === 'HIGH' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    0.001
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={onClear}
            disabled={isPending}
            className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Clear
          </button>

          <button
            onClick={() => onRevokeBatch(currentTipWei)}
            disabled={isPending || selectedCount === 0}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-rose-600 hover:from-indigo-600 hover:to-rose-700 text-white transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isPending && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            <span>
              {isPending
                ? 'Confirming Multicall...'
                : `Batch Revoke (${selectedCount})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

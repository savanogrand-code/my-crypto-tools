import React from 'react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Failed to load approvals from the blockchain. Public RPC might be rate-limited.',
  onRetry,
}) => {
  return (
    <div className="w-full p-8 border border-rose-900/40 bg-rose-950/20 rounded-2xl text-center space-y-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-900/30 text-rose-400 text-2xl">
        ⚠️
      </div>
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-rose-200">Data Fetching Issue</h4>
        <p className="text-sm text-slate-400 max-w-md mx-auto">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 transition-colors shadow"
        >
          Retry Scan
        </button>
      )}
    </div>
  );
};

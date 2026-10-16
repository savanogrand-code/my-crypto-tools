import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 py-8 px-4 text-center mt-auto">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>100% Client-Side Inspection</span>
          </span>
          <span>•</span>
          <span>Zero Server Storage</span>
          <span>•</span>
          <span>Open Source Multicall3 Standard</span>
          <span>•</span>
          <a
            href="https://t.me/PermitGuardBot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:text-sky-300 transition-colors"
          >
            Telegram Alerts Bot ↗
          </a>
        </div>

        <p className="text-[11px] text-slate-500 max-w-xl mx-auto leading-relaxed">
          Disclaimer: PermitGuard is an open-source decentralized utility. Revoking approvals requires gas on the
          respective network. Always verify contract interactions in your wallet before signing transactions.
        </p>

        <div className="text-[11px] text-slate-600">
          © {new Date().getFullYear()} PermitGuard. Built for DeFi security on Ethereum, Base, Arbitrum & Optimism.
        </div>
      </div>
    </footer>
  );
};

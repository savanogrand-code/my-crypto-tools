import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export const ConnectPrompt: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 text-center space-y-10">
      {/* Hero Badge */}
      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-900 border border-indigo-500/30 text-indigo-300">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Ethereum • Base • Arbitrum • Optimism • Permit2</span>
      </div>

      {/* Main Title */}
      <div className="space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          Protect Your Bags with{' '}
          <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-rose-400 bg-clip-text text-transparent">
            PermitGuard
          </span>
        </h1>
        <p className="text-base text-slate-400 leading-relaxed">
          Smart contracts with unlimited token approvals can drain your wallet balance if exploited or upgraded.
          PermitGuard audits your ERC-20, Permit2, and NFT authorizations and revokes them with batch Multicall3.
        </p>
      </div>

      {/* Connect CTA */}
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="scale-110">
          <ConnectButton />
        </div>
        <p className="text-xs text-slate-500">
          100% Client-Side • Zero Backend • No Private Keys Ever Stored
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-6">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="text-2xl">⚡</div>
          <h3 className="text-sm font-semibold text-slate-100">Batch Revoke with Multicall3</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Revoke dozens of dangerous allowances in a single transaction, saving gas and transaction signing fatigue.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="text-2xl">🦄</div>
          <h3 className="text-sm font-semibold text-slate-100">Uniswap Permit2 Lockdown</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            PermitGuard inspects both classic ERC-20 approvals and signature-based Uniswap Permit2 allowances.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="text-2xl">🔔</div>
          <h3 className="text-sm font-semibold text-slate-100">Pro Real-time Telegram Alerts</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Get instant alerts delivered to your Telegram whenever a new approval or high-risk permission is authorized.
          </p>
        </div>
      </div>
    </div>
  );
};

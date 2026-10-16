import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-lg shadow-md shadow-indigo-500/20">
            🛡️
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-white flex items-center space-x-1.5">
              <span>PermitGuard</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                v1.0
              </span>
            </div>
            <div className="text-[11px] text-slate-400 -mt-0.5">Web3 Approval & Permit Guard</div>
          </div>
        </div>

        {/* RainbowKit Connect Button */}
        <div className="flex items-center space-x-3">
          <ConnectButton
            showBalance={false}
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
          />
        </div>
      </div>
    </header>
  );
};

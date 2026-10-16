import React from 'react';
import { WalletRiskSummary } from '@/types';

interface ShareRiskScoreProps {
  summary: WalletRiskSummary;
}

export const ShareRiskScore: React.FC<ShareRiskScoreProps> = ({ summary }) => {
  const handleShare = () => {
    const dangerousCount = summary.criticalCount + summary.highCount;
    let tweetText = '';

    if (dangerousCount > 0) {
      tweetText = `🛡️ Just scanned my Web3 wallet on PermitGuard and discovered ${dangerousCount} HIGH-risk token permissions! \n\nCleaned up my allowances to protect my bags. Scan yours free:\n`;
    } else {
      tweetText = `🛡️ Just scanned my Web3 wallet with PermitGuard — 100% clean approvals! No dangerous unlimited allowances found.\n\nCheck your wallet security:\n`;
    }

    const url = 'https://permitguard.pages.dev';
    const hashtags = 'Web3Security,DeFi,Ethereum,Crypto';
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}&hashtags=${hashtags}`;

    window.open(intentUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition-colors shadow-sm"
      title="Share your risk score on X/Twitter"
    >
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      <span>Share Score</span>
    </button>
  );
};

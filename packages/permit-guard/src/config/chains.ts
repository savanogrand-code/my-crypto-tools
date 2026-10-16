import { mainnet, base, arbitrum, optimism } from 'viem/chains';

export const supportedChains = [mainnet, base, arbitrum, optimism] as const;

export type SupportedChainId = (typeof supportedChains)[number]['id'];

export const chainNames: Record<number, string> = {
  [mainnet.id]: 'Ethereum',
  [base.id]: 'Base',
  [arbitrum.id]: 'Arbitrum',
  [optimism.id]: 'Optimism',
};

export const chainExplorers: Record<number, string> = {
  [mainnet.id]: 'https://etherscan.io',
  [base.id]: 'https://basescan.org',
  [arbitrum.id]: 'https://arbiscan.io',
  [optimism.id]: 'https://optimistic.etherscan.io',
};

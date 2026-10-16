import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, fallback } from 'viem';
import { mainnet, base, arbitrum, optimism } from 'viem/chains';

const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY || '';
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '3a8170812b534d0ff9d794f168c41d1a';

// Build transports with Alchemy primary and reliable public fallback
const buildTransport = (alchemySubdomain: string, publicRpc: string) => {
  if (alchemyApiKey) {
    return fallback([
      http(`https://${alchemySubdomain}.g.alchemy.com/v2/${alchemyApiKey}`),
      http(publicRpc),
      http(),
    ]);
  }
  return fallback([http(publicRpc), http()]);
};

export const wagmiConfig = getDefaultConfig({
  appName: 'PermitGuard',
  projectId: walletConnectProjectId,
  chains: [mainnet, base, arbitrum, optimism],
  transports: {
    [mainnet.id]: buildTransport('eth-mainnet', 'https://eth.llamarpc.com'),
    [base.id]: buildTransport('base-mainnet', 'https://base.llamarpc.com'),
    [arbitrum.id]: buildTransport('arb-mainnet', 'https://arb1.arbitrum.io/rpc'),
    [optimism.id]: buildTransport('opt-mainnet', 'https://mainnet.optimism.io'),
  },
  ssr: false,
});

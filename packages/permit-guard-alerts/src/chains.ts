/**
 * Chain configuration registry.
 * Maps chain IDs to their RPC URLs, explorers, and metadata.
 */

/** Configuration for a supported EVM chain */
export interface ChainConfig {
  /** Numeric chain ID */
  chainId: number;
  /** Human-readable chain name */
  name: string;
  /** Alchemy RPC subdomain (e.g. "eth-mainnet") */
  alchemySubdomain: string;
  /** Block explorer base URL */
  explorerUrl: string;
  /** Block explorer name for display */
  explorerName: string;
}

/** Supported chain configurations keyed by chain ID */
const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  1: {
    chainId: 1,
    name: 'Ethereum',
    alchemySubdomain: 'eth-mainnet',
    explorerUrl: 'https://etherscan.io',
    explorerName: 'Etherscan',
  },
  8453: {
    chainId: 8453,
    name: 'Base',
    alchemySubdomain: 'base-mainnet',
    explorerUrl: 'https://basescan.org',
    explorerName: 'BaseScan',
  },
  42161: {
    chainId: 42161,
    name: 'Arbitrum',
    alchemySubdomain: 'arb-mainnet',
    explorerUrl: 'https://arbiscan.io',
    explorerName: 'Arbiscan',
  },
  10: {
    chainId: 10,
    name: 'Optimism',
    alchemySubdomain: 'opt-mainnet',
    explorerUrl: 'https://optimistic.etherscan.io',
    explorerName: 'OP Etherscan',
  },
};

/**
 * Get configuration for a specific chain.
 * @throws if the chain is not supported
 */
export function getChainConfig(chainId: number): ChainConfig {
  const config = CHAIN_CONFIGS[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return config;
}

/**
 * Build the Alchemy RPC URL for a given chain.
 */
export function getAlchemyRpcUrl(chainId: number, apiKey: string): string {
  const config = getChainConfig(chainId);
  return `https://${config.alchemySubdomain}.g.alchemy.com/v2/${apiKey}`;
}

/**
 * Build a transaction explorer link.
 */
export function getTxExplorerUrl(chainId: number, txHash: string): string {
  const config = getChainConfig(chainId);
  return `${config.explorerUrl}/tx/${txHash}`;
}

/**
 * Build an address explorer link.
 */
export function getAddressExplorerUrl(chainId: number, address: string): string {
  const config = getChainConfig(chainId);
  return `${config.explorerUrl}/address/${address}`;
}

/**
 * Parse the SUPPORTED_CHAINS env var into an array of chain IDs.
 */
export function parseSupportedChains(chainsStr: string): number[] {
  return chainsStr
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((id) => !isNaN(id) && CHAIN_CONFIGS[id] !== undefined);
}

/**
 * Get all supported chain IDs.
 */
export function getAllSupportedChainIds(): number[] {
  return Object.keys(CHAIN_CONFIGS).map(Number);
}

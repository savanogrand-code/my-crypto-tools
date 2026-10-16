// Canonical Uniswap Permit2 address is identical across all EVM chains
export const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3' as const;

// Multicall3 canonical address is identical across EVM chains
export const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11' as const;

// Default tip recipient address (developer wallet placeholder)
export const DEFAULT_TIP_RECIPIENT = '0x2289c020101b0847b2c01ba6f296c0989a1c1d80' as const;

// Default tip amount: 0.0003 ETH equivalent in wei
export const DEFAULT_TIP_AMOUNT = 300000000000000n; // 0.0003 ETH

// Max uint256 threshold for unlimited allowances
export const MAX_UINT256 = 2n ** 256n - 1n;
export const UNLIMITED_THRESHOLD = 2n ** 200n;

// Known protocols for friendly spender labeling
export const KNOWN_SPENDERS: Record<string, { name: string; verified: boolean }> = {
  '0x000000000022d473030f116ddee9f6b43ac78ba3': { name: 'Uniswap Permit2', verified: true },
  '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': { name: 'Uniswap Universal Router', verified: true },
  '0xe592427a0aece92de3edee1f18e0157c05861564': { name: 'Uniswap V3 SwapRouter', verified: true },
  '0x1111111254eeb25477b68fb85ed929f73a960582': { name: '1inch v5 Router', verified: true },
  '0x111111125421ca6dc452d289314280a0f8842a65': { name: '1inch v6 Router', verified: true },
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff': { name: '0x Exchange Proxy', verified: true },
  '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad': { name: 'Uniswap Universal Router (v2)', verified: true },
  '0x2626664c2603336e57b271c5c0b26f421741e481': { name: 'Base Uniswap SwapRouter02', verified: true },
  '0x198ef79f1f515f02dfe9e3115ed9fc07183f02fc': { name: 'Base Aerodrome Router', verified: true },
  '0xc30141b657f4216252dc59af2e7cdb9d8792e1b0': { name: 'Socket Gateway', verified: true },
};

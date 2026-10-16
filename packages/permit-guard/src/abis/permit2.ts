import { parseAbi } from 'viem';

export const permit2Abi = parseAbi([
  'function allowance(address user, address token, address spender) view returns (uint160 amount, uint48 expiration, uint48 nonce)',
  'function approve(address token, address spender, uint160 amount, uint48 expiration) external',
  'struct TokenSpenderPair { address token; address spender; }',
  'function lockdown((address token, address spender)[] approvals) external',
  'function invalidateNonces(address token, address spender, uint48 newNonce) external',
  'event Approval(address indexed owner, address indexed token, address indexed spender, uint160 amount, uint48 expiration)',
  'event Lockdown(address indexed owner, address token, address spender)',
]);

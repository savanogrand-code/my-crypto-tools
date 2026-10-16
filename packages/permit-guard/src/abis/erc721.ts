import { parseAbi } from 'viem';

export const erc721Abi = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function setApprovalForAll(address operator, bool approved) external',
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
]);

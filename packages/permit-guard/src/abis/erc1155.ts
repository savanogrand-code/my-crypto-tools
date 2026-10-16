import { parseAbi } from 'viem';

export const erc1155Abi = parseAbi([
  'function isApprovedForAll(address account, address operator) view returns (bool)',
  'function setApprovalForAll(address operator, bool approved) external',
  'event ApprovalForAll(address indexed account, address indexed operator, bool approved)',
]);

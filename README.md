# 🛡️ Crypto Side Tools

A monorepo containing two Web3 tools:

## Projects

### [PermitGuard](./packages/permit-guard/)
Client-side Web3 token approval scanner & revoker. Supports ERC-20, Permit2, and NFT approvals across Ethereum, Base, Arbitrum, and Optimism.

### [Whale Alert Bot](./packages/whale-bot/)
Solana whale swap alert Telegram bot powered by Helius webhooks with Jupiter referral integration.

## Tech Stack
- **Monorepo**: pnpm workspaces
- **Frontend**: Vite + React 19 + TypeScript + Tailwind CSS 4
- **Web3**: wagmi v2 + viem v2 + RainbowKit v2
- **Backend**: Cloudflare Workers + KV
- **Deploy**: Cloudflare Pages + Workers

## Development

```bash
# Install dependencies
pnpm install

# Run PermitGuard dev server
pnpm dev:permit-guard

# Run Whale Bot locally
pnpm dev:whale-bot

# Run all tests
pnpm test

# Build everything
pnpm build
```

## License
MIT
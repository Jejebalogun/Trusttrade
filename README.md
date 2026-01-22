# TrustTrade - Reputation-Weighted OTC Trading DApp

A decentralized P2P trading platform on Base Blockchain that integrates Ethos Network reputation scores to provide dynamic fee structures based on user credibility.

## Overview

TrustTrade enables users to trade ETH for ERC20 tokens directly (P2P) with fees that decrease based on their Ethos Credibility Score:

- **Score ≥ 2000**: 0% Fee (VIP Tier - Trustless)
- **Score 1000-1999**: 1% Fee (Standard Tier)
- **Score < 1000**: 2.5% Fee (High Risk Tier)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Web3**: Wagmi, Viem, RainbowKit
- **Smart Contracts**: Solidity 0.8.24, Hardhat
- **Blockchain**: Base Sepolia Testnet
- **Reputation**: Ethos Network API

## Project Structure

```
trusttrade/
├── app/                    # Next.js 14 app directory
├── components/            # React components
├── contracts/             # Solidity smart contracts
│   ├── TrustTrade.sol    # Main trading contract
│   └── MockERC20.sol     # Test token
├── scripts/              # Deployment scripts
│   ├── deploy.ts         # Deploy TrustTrade
│   └── deployMockToken.ts # Deploy test token
├── test/                 # Smart contract tests
├── lib/                  # Utility libraries
│   ├── ethos.ts         # Ethos API client
│   ├── contract.ts      # Contract ABI & address
│   └── wagmi.ts         # Web3 configuration
├── hooks/               # Custom React hooks
│   └── useReputationFee.ts
└── hardhat.config.ts    # Hardhat configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or another Web3 wallet
- Base Sepolia ETH (from [faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))

### Installation

1. Clone and install dependencies:

```bash
npm install
```

2. Create `.env` file:

```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:

```env
# Blockchain
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your_private_key_here
BASESCAN_API_KEY=your_basescan_api_key_here

# Frontend
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_CONTRACT_ADDRESS=deployed_contract_address
```

Get a WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/).

### Smart Contract Development

#### Compile Contracts

```bash
npx hardhat compile
```

#### Run Tests

```bash
npx hardhat test
```

#### Deploy to Base Sepolia

```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

#### Deploy Mock Token (for testing)

```bash
npx hardhat run scripts/deployMockToken.ts --network baseSepolia
```

#### Verify Contract

```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> "<FEE_COLLECTOR_ADDRESS>"
```

### Frontend Development

#### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Build for Production

```bash
npm run build
npm start
```

## Smart Contract Overview

### TrustTrade.sol

**Key Functions:**

- `createTrade(token, tokenAmount, ethPrice, feeBasisPoints)` - Create a new trade offer
- `executeTrade(tradeId)` - Execute a trade by sending ETH
- `cancelTrade(tradeId)` - Cancel an active trade
- `getTrade(tradeId)` - Get trade details
- `getActiveTradesCount()` - Get count of active trades

**Security Features:**

- ReentrancyGuard protection
- SafeERC20 for token transfers
- Custom errors for gas optimization
- Fee validation and calculation
- Access control for cancellations

## Ethos Network Integration

The platform fetches user reputation scores from Ethos Network API:

```typescript
// lib/ethos.ts
fetchEthosScore(address: string): Promise<EthosScore>
```

Reputation data includes:
- Credibility score
- Positive/negative/neutral reviews
- Calculated fee tier

## Fee Calculation

Fees are calculated in basis points (1 bp = 0.01%):

```typescript
// lib/ethos.ts
getFeePercentage(score: number): number
feePercentageToBasisPoints(feePercent: number): number
```

The smart contract applies fees during trade execution and sends them to the fee collector.

## Development Commands

```bash
# Smart Contracts
npm run compile          # Compile contracts
npm run test            # Run tests
npm run deploy          # Deploy to Base Sepolia

# Frontend
npm run dev             # Start dev server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
```

## Architecture Decisions

1. **Client-Side Fee Calculation**: Fees are calculated on the frontend based on Ethos scores, then passed to the contract. This allows for flexible fee structures without on-chain oracle complexity.

2. **Trade Lifecycle**: Trades go through three states - Active, Completed, Cancelled. Tokens are held by the contract during active trades.

3. **No Backend Database**: All data is stored on-chain or fetched from external APIs (Ethos), keeping the architecture simple and decentralized.

4. **Base Sepolia**: Chosen for low transaction costs and fast block times, ideal for a trading platform MVP.

## Contributing

This is a hackathon project built for the Ethos "Vibeathon". Contributions and feedback are welcome!

## License

MIT



## Hackathon Details

**Event**: Ethos "Vibeathon"
**Project**: TrustTrade
**Category**: Reputation-Based DeFi
**Network**: Base Sepolia

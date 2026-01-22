# TrustTrade - Reputation-Weighted OTC Trading DApp

A decentralized P2P trading platform on Base Blockchain that integrates Ethos Network reputation scores to provide dynamic fee structures based on user credibility.

## Overview

TrustTrade enables users to trade ETH for ERC20 tokens directly (P2P) with fees that decrease based on their Ethos Credibility Score:

- **Score ≥ 2000**: 0% Fee (VIP Tier - Trustless)
- **Score 1000-1999**: 1% Fee (Standard Tier)
- **Score < 1000**: 2.5% Fee (High Risk Tier)

### Key Features

**Trading & Escrow:**
- Create and manage OTC trades with escrow protection
- Automatic escrow period (default 24 hours) for trade security
- Release escrow or dispute functionality for buyers/sellers
- Real-time trade status tracking

**User Profiles & Trust:**
- ENS avatar integration with DiceBear fallback avatars
- Social profile links (Twitter/X and Discord)
- User review system (1-5 star ratings)
- Average rating calculations for reputation
- Profile editing modal for users to manage social presence

**Trade Management:**
- Browse complete trade history with advanced filtering
- Filter by status (Active, Escrow, Completed, Disputed, Cancelled)
- Sort by date, value, or custom metrics
- Expandable trade details with transaction information
- Trade summary statistics (success rate, total value)

**Dispute Resolution:**
- Professional dispute resolution UI for contested trades
- Fee collector authorization for resolution decisions
- Detailed reasoning for dispute outcomes
- Clear status tracking (pending vs resolved)

**Community Features:**
- User review submission with validation (10-500 char comments)
- Helpful vote system for reviews
- Rating distribution charts
- Sorted review views (recent, helpful, highest, lowest)
- Review display on trader profiles

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, React Hooks
- **Web3**: Wagmi v2, Viem v2, RainbowKit
- **Smart Contracts**: Solidity 0.8.24, OpenZeppelin contracts, Hardhat
- **Blockchain**: Base Sepolia Testnet
- **Reputation**: Ethos Network API
- **ENS Integration**: Ethereum Name Service (via ensdata.net)
- **Avatars**: DiceBear API for deterministic fallback avatars
- **Backend**: Express.js, TypeScript, Node.js
- **Blockchain Indexing**: The Graph (Subgraph), GraphQL
- **Database**: Firebase Firestore, Firebase Authentication
- **File Generation**: PDFKit for trade receipts
- **State Management**: React Context (Toast system), Wagmi hooks

## Project Structure

```
trusttrade/
├── app/                              # Next.js 14 app directory
│   ├── layout.tsx                   # Root layout with providers
│   ├── page.tsx                     # Home/trading page
│   ├── providers.tsx                # Web3 & app providers
│   └── dashboard/
│       └── page.tsx                 # Analytics dashboard
├── components/                      # React components
│   ├── TradeFeed.tsx               # Main trading interface
│   ├── TradeForm.tsx               # Create trade form
│   ├── TradeStats.tsx              # Trade statistics display
│   ├── TradeHistory.tsx            # Trade history with filters
│   ├── DisputeResolution.tsx       # Dispute resolution UI
│   ├── UserReviews.tsx             # Review system UI
│   ├── UserProfile.tsx             # User profile display
│   ├── UserProfileForm.tsx         # Profile editing form
│   ├── UserProfileModal.tsx        # Profile modal wrapper
│   ├── SocialLinks.tsx             # Social links display
│   ├── EscrowTimer.tsx             # Escrow countdown timer
│   ├── TraderProfile.tsx           # Trader stats display
│   ├── Header.tsx                  # Navigation header
│   ├── Hero.tsx                    # Landing hero section
│   ├── Analytics.tsx               # Dashboard analytics
│   ├── Toast.tsx                   # Notification system
│   ├── Skeleton.tsx                # Loading skeletons
│   ├── ErrorBoundary.tsx           # Error handling
│   └── Dashboard.tsx               # Main dashboard layout
├── contracts/                       # Solidity smart contracts
│   ├── TrustTrade.sol             # Main trading contract with escrow & reviews
│   └── MockERC20.sol              # Test token
├── scripts/                         # Deployment scripts
│   ├── deploy.ts                  # Deploy TrustTrade
│   └── deployMockToken.ts         # Deploy test token
├── test/                           # Smart contract tests
│   └── TrustTrade.test.ts
├── lib/                            # Utility libraries
│   ├── api.ts                     # API client (Express) ✨ NEW
│   ├── ethos.ts                   # Ethos API client
│   ├── ens.ts                     # ENS avatar & name fetching
│   ├── contract.ts                # Contract ABI & address
│   ├── tokens.ts                  # Token utilities
│   └── wagmi.ts                   # Web3 configuration
├── hooks/                          # Custom React hooks
│   ├── useApi.ts                  # API fetching hook ✨ NEW
│   ├── useOptimizedTrades.ts      # Trade optimization hook
│   ├── useReputationFee.ts        # Fee calculation hook
│   ├── useUserProfile.ts          # User profile contract hooks
│   └── useReviews.ts              # Review contract hooks
├── subgraph/                       # The Graph Subgraph ✨ NEW
│   ├── subgraph.yaml              # Blockchain data source
│   ├── schema.graphql             # GraphQL entities (6 entities)
│   └── src/mapping.ts             # 11 event handlers
├── api/                            # Express API Server ✨ NEW
│   ├── src/
│   │   ├── server.ts              # 14 REST endpoints
│   │   ├── services/
│   │   │   └── pdfService.ts      # PDF receipt generation
│   │   └── config/
│   │       └── firebase.ts        # Firebase setup
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── API_DOCS.md                # API documentation
├── hardhat.config.ts              # Hardhat configuration
├── tailwind.config.ts             # Tailwind CSS config
├── tsconfig.json                  # TypeScript config
├── BACKEND_QUICKSTART.md          # Quick start guide ✨ NEW
├── BACKEND_SUMMARY.md             # Architecture overview ✨ NEW
├── DEPLOYMENT.md                  # Deployment guide ✨ NEW
├── FRONTEND_INTEGRATION.md        # Integration guide ✨ NEW
└── Documentation_Index.md         # Complete documentation index ✨ NEW
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or another Web3 wallet
- Base Sepolia ETH (from [faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))

### Quick Start

**Frontend Only:**
```bash
npm install
npm run dev
# Open http://localhost:3000
```

**With Backend (API Server):**
```bash
# Terminal 1: API Server
cd api
npm install
npm run dev
# API running on http://localhost:3001

# Terminal 2: Frontend
npm run dev
# Frontend on http://localhost:3000
```

See [BACKEND_QUICKSTART.md](./BACKEND_QUICKSTART.md) for detailed setup.

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
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Backend (API Server)
# See api/.env.example for configuration
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

**Core Structs:**
- `Trade` - Trade details with escrow & dispute tracking
- `UserProfile` - Social links (Twitter/Discord)
- `Review` - User reviews with ratings and helpful votes

**Trading Functions:**
- `createTrade(token, tokenAmount, ethPrice, feeBasisPoints)` - Create a new trade offer
- `executeTrade(tradeId)` - Execute a trade, tokens go to buyer, ETH held in escrow
- `cancelTrade(tradeId)` - Cancel an active trade
- `releaseEscrow(tradeId)` - Release ETH to seller after escrow period
- `disputeTrade(tradeId, reason)` - Dispute a trade during escrow
- `resolveDispute(tradeId, favorsbuyer)` - Resolve dispute (fee collector only)
- `getTrade(tradeId)` - Get trade details
- `isEscrowExpired(tradeId)` - Check if escrow period expired

**User Profile Functions:**
- `setUserProfile(twitter, discord)` - Set/update social profile links
- `getUserProfile(user)` - Fetch user's social profile

**Review Functions:**
- `submitReview(reviewee, rating, comment)` - Submit a review (1-5 stars, 10-500 chars)
- `markReviewHelpful(reviewId)` - Vote a review as helpful
- `getReview(reviewId)` - Get review details
- `getUserReviews(user)` - Get all review IDs for a user
- `getUserAverageRating(user)` - Get user's average rating (scaled by 100)

**Management Functions:**
- `setDefaultEscrowDuration(newDuration)` - Update escrow period
- `updateFeeCollector(newCollector)` - Update fee collector address
- `getActiveTradesCount()` - Get count of active trades

**Security Features:**
- ReentrancyGuard protection on all write operations
- SafeERC20 for secure token transfers
- Custom errors for gas optimization
- Input validation (rating 1-5, comment length, address checks)
- Duplicate review prevention per user
- Access control for dispute resolution

## Component Overview

### Core Trading Components
- **TradeFeed.tsx** - Display active trades with escrow timers and action buttons
- **TradeForm.tsx** - Create new trade offers with validation
- **TradeStats.tsx** - Show trade statistics and metrics

### User Management
- **UserProfile.tsx** - Display user profiles with ENS avatars and social links
- **UserProfileForm.tsx** - Form for editing Twitter/Discord profiles
- **UserProfileModal.tsx** - Modal wrapper for profile editing
- **SocialLinks.tsx** - Render social media links (Twitter/Discord)

### Trading Features
- **TradeHistory.tsx** - Browse trades with filters (status, sort) and expandable details
- **DisputeResolution.tsx** - Resolve trade disputes with decision logic
- **UserReviews.tsx** - Display and submit reviews with 5-star ratings
- **EscrowTimer.tsx** - Countdown timer for escrow expiration

### Supporting Components
- **Header.tsx** - Navigation with wallet connection and profile button
- **Analytics.tsx** - Dashboard analytics and metrics
- **Toast.tsx** - Notification/alert system for user feedback
- **Skeleton.tsx** - Loading placeholders
- **ErrorBoundary.tsx** - Error handling wrapper
- **TraderProfile.tsx** - Display trader reputation and stats

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

## ENS & Avatar Integration

User profiles display ENS names and avatars fetched from:
- **Ethereum Name Service (ENS)** - Via ensdata.net API
- **DiceBear** - Deterministic fallback avatars based on address seed

```typescript
// lib/ens.ts
fetchEnsAvatar(address: string): Promise<string>    // Fetch or generate avatar
fetchEnsName(address: string): Promise<string>      // Resolve ENS name
formatAddressShort(address: string): string         // Format address (0x123...abcd)
```

## Review System

On-chain review system for building trust in the marketplace:

```typescript
// Smart Contract
submitReview(reviewee: string, rating: 1-5, comment: string)
getUserAverageRating(user: string): number          // Scaled by 100 (450 = 4.5 stars)
getUserReviews(user: string): Review[]              // All reviews for user
markReviewHelpful(reviewId: number)                 // Vote on review helpfulness
```

Reviews are stored on-chain and include:
- 1-5 star rating system
- Validated comments (10-500 characters)
- Helpful vote counts
- Reviewer identification
- Creation timestamps
- Duplicate prevention per user

## Fee Calculation

Fees are calculated in basis points (1 bp = 0.01%):

```typescript
// lib/ethos.ts
getFeePercentage(score: number): number
feePercentageToBasisPoints(feePercent: number): number
```

The smart contract applies fees during trade execution and sends them to the fee collector.

## React Hooks API

### User Profile Hooks
```typescript
// hooks/useUserProfile.ts
useSetUserProfile()         // Submit/update profile (twitter, discord)
useGetUserProfile(address)  // Fetch user's profile data
```

### Review Hooks
```typescript
// hooks/useReviews.ts
useSubmitReview()           // Submit a review with rating and comment
useGetUserReviews(address)  // Fetch all review IDs for a user
useGetUserAverageRating(address)  // Get user's average rating
useGetReview(reviewId)      // Fetch specific review details
useMarkReviewHelpful()      // Vote on review helpfulness
```

### Trade Hooks
```typescript
// hooks/useOptimizedTrades.ts
useOptimizedTrades()        // Fetch and optimize active trades

// hooks/useReputationFee.ts
useReputationFee(userAddress)  // Calculate fee based on Ethos score
```

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

2. **Escrow-Based Trade Lifecycle**: Trades enter escrow immediately after buyer sends ETH:
   - Tokens transferred to buyer
   - ETH held by contract
   - After escrow period, seller can release ETH with fees deducted
   - Disputes can be raised during escrow window

3. **On-Chain Reviews**: Reviews are stored on-chain to create permanent, verifiable reputation history. This prevents manipulation and builds long-term trust.

4. **ENS + DiceBear Avatars**: ENS resolution provides ENS names and avatars when available, with DiceBear as deterministic fallback. No external database needed for user identity.

5. **Social Profile Links**: Twitter/Discord links stored on-chain allow users to verify their identities and build cross-platform presence.

6. **Fee Collector Authorization**: Only the fee collector can resolve disputes, preventing unauthorized interference with trade conflicts.

7. **Three-Phase Backend Architecture**:
   - **Phase 1 - Subgraph**: The Graph Subgraph indexes blockchain events, providing GraphQL API for efficient queries
   - **Phase 2 - API Server**: Express.js server queries the Subgraph and serves REST endpoints for frontend
   - **Phase 3 - Database**: Firebase Firestore stores user preferences, notifications, and audit logs

8. **Base Sepolia**: Chosen for low transaction costs and fast block times, ideal for a trading platform MVP.

## Backend Infrastructure ✨ NEW

### Overview

The TrustTrade backend consists of three integrated components:

1. **The Graph Subgraph** - Real-time blockchain event indexing with GraphQL API
2. **Express API Server** - REST endpoints for frontend, queries the Subgraph
3. **Firebase Firestore** - User preferences, notifications, and data persistence

### Subgraph (Phase 1)

Located in `subgraph/` directory, handles blockchain event indexing:

**GraphQL Schema** (6 Entities):
- `Trade` - Trade details, status, escrow info
- `User` - User stats, ratings, profile reference
- `Review` - Ratings, comments, helpful votes
- `UserProfile` - Social links (Twitter/Discord)
- `Dispute` - Dispute details and resolution
- `Platform` - Aggregated platform statistics

**Event Handlers** (11 events):
- `handleTradeCreated` - New trade created
- `handleTradeExecuted` - Trade executed to escrow
- `handleTradeInEscrow` - Trade in escrow period
- `handleTradeCompleted` - Trade completed successfully
- `handleTradeCancelled` - Trade cancelled
- `handleTradeDisputed` - Trade disputed
- `handleDisputeResolved` - Dispute resolved
- `handleUserProfileUpdated` - Profile updated
- `handleReviewSubmitted` - Review submitted
- `handleReviewHelpful` - Review marked helpful
- Platform statistics aggregation on all events

**Deployment**: The Graph Studio (https://studio.thegraph.com)

### API Server (Phase 2)

Located in `api/` directory, Express.js server with TypeScript.

**14 REST Endpoints**:

```
Trades (4 endpoints):
  GET  /trades/active              - All active trades
  GET  /trades/user/:address       - User's created trades
  GET  /trades/:tradeId            - Single trade details
  GET  /trades/:tradeId/receipt    - Trade receipt (PDF/JSON)

Users (2 endpoints):
  GET  /users/:address             - User profile & stats
  GET  /users/:address/stats       - User statistics only

Reviews (1 endpoint):
  GET  /reviews/user/:address      - User's reviews

Analytics (1 endpoint):
  GET  /analytics/platform         - Platform statistics

Notifications (5 endpoints):
  POST   /notifications/preferences          - Save preferences
  GET    /notifications/preferences/:address - Get preferences
  GET    /notifications/user/:address        - User notifications
  POST   /notifications                      - Create notification
  PATCH  /notifications/:notificationId/read - Mark as read

Health (1 endpoint):
  GET  /health                     - API health check
```

**Features**:
- GraphQL client integration with The Graph Subgraph
- Firebase Firestore integration for persistent data
- PDF receipt generation using PDFKit
- Comprehensive error handling
- CORS enabled for frontend integration
- Full TypeScript type safety

**Deployment**: Vercel, Heroku, or AWS

### Database (Phase 3)

Firebase Firestore collections:

```
notificationPreferences/{address}
  - User notification settings
  - Email notification toggle

notifications/{docId}
  - User activity notifications
  - Trade events, reviews, disputes
  - Read/unread tracking

tradeReceipts/{tradeId}
  - Receipt metadata caching
  - Generated PDF URLs

userSettings/{address}
  - Theme preferences
  - Language/currency settings
  - Account security

auditLogs/{docId}
  - Security audit trail
  - Action logging

blocklist/{address}
  - User blocklist management

apiKeys/{docId}
  - External integration keys
  - Rate limit configuration
```

**Security**:
- Firestore Security Rules (user-based access control)
- Backend-only write protection for audit logs
- Composite indexes for query performance

### Data Flow

```
Frontend (React)
    ↓ (HTTP REST)
API Server (Express.js)
    ↓ (GraphQL)          ↓ (Read/Write)
Subgraph (The Graph)    Firestore (Firebase)
    ↓ (Indexes)
Blockchain Events
```

### Documentation

Complete backend documentation available:
- **[BACKEND_QUICKSTART.md](./BACKEND_QUICKSTART.md)** - 5-minute setup guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[api/API_DOCS.md](./api/API_DOCS.md)** - Complete API reference
- **[FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)** - React integration guide
- **[BACKEND_SUMMARY.md](./BACKEND_SUMMARY.md)** - Architecture overview
- **[Documentation_Index.md](./Documentation_Index.md)** - Full documentation index

### Quick Start Backend

```bash
# Install dependencies
npm install
cd api && npm install
cd ../subgraph && npm install

# Start API server (Terminal 1)
cd api
npm run dev
# API running on http://localhost:3001

# Start frontend (Terminal 2)
npm run dev
# Frontend on http://localhost:3000
```

### Deployment Checklist

- [ ] Deploy Subgraph to The Graph Studio
- [ ] Deploy API Server to Vercel/Heroku
- [ ] Set up Firebase Firestore database
- [ ] Configure Firestore security rules
- [ ] Update frontend API endpoint
- [ ] Test all endpoints
- [ ] Set up monitoring and logging

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Contributing

This is a hackathon project built for the Ethos "Vibeathon". Contributions and feedback are welcome!

## License

MIT



## Hackathon Details

**Event**: Ethos "Vibeathon"
**Project**: TrustTrade
**Category**: Reputation-Based DeFi
**Network**: Base Sepolia

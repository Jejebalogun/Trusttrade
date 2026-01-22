# TrustTrade - Quick Start Guide

## 🚀 What We Built

A complete reputation-weighted OTC trading DApp with:

✅ **Smart Contract** - TrustTrade.sol with reputation-based fees
✅ **Frontend** - Beautiful Avantis-inspired UI with glassmorphism
✅ **Ethos Integration** - Real-time reputation score fetching
✅ **Web3 Wallet Connection** - RainbowKit integration
✅ **Dynamic Fee System** - 0% (VIP), 1% (Standard), 2.5% (High Risk)

## 📁 Project Structure

```
trusttrade/
├── contracts/           # Solidity smart contracts
│   ├── TrustTrade.sol  # Main trading contract
│   └── MockERC20.sol   # Test token
├── app/                # Next.js pages
│   ├── page.tsx        # Main dashboard
│   ├── layout.tsx      # App layout
│   └── providers.tsx   # Web3 providers
├── components/         # React components
│   ├── Header.tsx      # Navigation with wallet connect
│   ├── Hero.tsx        # Hero section with fee tiers
│   ├── ReputationCard.tsx  # User reputation display
│   ├── TradeForm.tsx   # Create trade interface
│   └── TradeFeed.tsx   # Active trades list
├── lib/                # Utilities
│   ├── ethos.ts        # Ethos API client
│   ├── contract.ts     # Contract ABI & address
│   └── wagmi.ts        # Web3 configuration
└── hooks/              # Custom hooks
    └── useReputationFee.ts
```

## 🛠️ Setup Instructions

### 1. Environment Variables

Create a `.env` file:

```bash
# Blockchain
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your_private_key_here
BASESCAN_API_KEY=your_basescan_api_key

# Frontend
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_CONTRACT_ADDRESS=deployed_contract_address
```

**Get WalletConnect Project ID:** https://cloud.walletconnect.com/

### 2. Install Dependencies

```bash
cd trusttrade
npm install
```

### 3. Compile Smart Contracts

```bash
npm run compile
```

### 4. Run Tests

```bash
npm run test
```

### 5. Deploy Contracts (Base Sepolia)

```bash
# Deploy TrustTrade contract
npm run deploy

# Deploy Mock Token for testing
npm run deploy:token
```

Copy the deployed contract address to `.env`:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

### 6. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

## 🎨 Design Features

### Colors
- **Neon Green (#00ff41)** - VIP tier (score ≥ 2000)
- **Blue (#3b82f6)** - Standard tier (score 1000-1999)
- **Orange (#ff6b35)** - High risk tier (score < 1000)
- **Teal (#14b8a6)** - Primary accent

### UI Components
- **Glassmorphism cards** with backdrop blur
- **Animated gradients** and smooth transitions
- **Framer Motion** animations for micro-interactions
- **Responsive design** for mobile and desktop

## 📊 How It Works

### For Sellers:
1. Connect wallet
2. View your Ethos reputation score
3. Enter token address, amount, and ETH price
4. Approve tokens → Create trade
5. Fee automatically calculated based on your score

### For Buyers:
1. Browse active trades in the feed
2. See seller's reputation score
3. Click "Buy Now" to execute trade
4. Send ETH, receive tokens instantly

## 🔐 Smart Contract Functions

### Create Trade
```solidity
createTrade(address token, uint256 tokenAmount, uint256 ethPrice, uint256 feeBasisPoints)
```

### Execute Trade
```solidity
executeTrade(uint256 tradeId) payable
```

### Cancel Trade
```solidity
cancelTrade(uint256 tradeId)
```

## 🌐 Ethos API Integration

Fetches reputation scores from:
```
https://api.ethos.network/api/v2/score/address?address={address}
```

Response:
```json
{
  "score": 2150,
  "level": "trusted"
}
```

## 🚢 Deployment Checklist

- [ ] Get Base Sepolia ETH from faucet
- [ ] Deploy TrustTrade contract
- [ ] Deploy Mock ERC20 token (for testing)
- [ ] Update `.env` with contract addresses
- [ ] Get WalletConnect Project ID
- [ ] Test wallet connection
- [ ] Test trade creation flow
- [ ] Verify contracts on Basescan

## 🐛 Troubleshooting

### "Module not found" errors
```bash
npm install
```

### Wallet connection issues
- Check WalletConnect Project ID in `.env`
- Make sure you're on Base Sepolia network

### Contract interaction fails
- Verify contract address in `.env`
- Check you have Base Sepolia ETH
- Ensure tokens are approved before creating trade

## 📚 Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Animations:** Framer Motion
- **Web3:** Wagmi, Viem, RainbowKit
- **Smart Contracts:** Solidity 0.8.24, Hardhat
- **Blockchain:** Base Sepolia
- **Reputation:** Ethos Network API

## 🎯 Next Steps

1. **Deploy to Production**: Vercel/Netlify
2. **Add More Features**:
   - Trade history
   - User profiles
   - Search/filter trades
   - Notifications
3. **Improve UX**:
   - Loading states
   - Error handling
   - Toast notifications
4. **Security Audit**: Before mainnet

## 🏆 Hackathon Submission

This project was built for the **Ethos "Vibeathon"** hackathon, demonstrating:
- Creative use of Ethos reputation scores
- Real-world DeFi application
- Clean, professional UI/UX
- Complete end-to-end functionality

---

**Built with ❤️ for Ethos Vibeathon**

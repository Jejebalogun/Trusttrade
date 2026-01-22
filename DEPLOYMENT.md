# TrustTrade Backend Deployment Guide

This guide covers deploying the Subgraph (The Graph), API Server, and Database (Firebase) for TrustTrade.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: Subgraph Deployment](#phase-1-subgraph-deployment)
3. [Phase 2: API Server Deployment](#phase-2-api-server-deployment)
4. [Phase 3: Database Setup](#phase-3-database-setup)
5. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Required Tools

- **Node.js**: v18+ (check with `node --version`)
- **npm**: v9+ (check with `npm --version`)
- **Git**: For version control

### Required Accounts

1. **The Graph Studio** (https://studio.thegraph.com)
   - Free account
   - Can host one Subgraph for free

2. **Firebase** (https://firebase.google.com)
   - Free tier available
   - Firestore database
   - Authentication

3. **Hosting Platform** (choose one)
   - **Vercel** (recommended for Next.js frontend)
   - **Netlify** (good alternative)
   - **AWS** / **Google Cloud** / **Azure** (for API server)
   - **Heroku** (simple deployment)

### Network Information

- **Chain**: Base Sepolia Testnet
- **RPC**: https://sepolia.base.org
- **Explorer**: https://sepolia.basescan.org
- **Contract Address**: (from your deployment)
- **Contract Deployment Block**: (from your deployment)

---

## Phase 1: Subgraph Deployment

### Step 1: Set Up The Graph CLI

```bash
npm install -g @graphprotocol/graph-cli
```

### Step 2: Initialize Subgraph

If not already done, initialize the Subgraph project:

```bash
graph init --studio trusttrade
cd subgraph
```

### Step 3: Configure Subgraph

Edit `subgraph/subgraph.yaml` and update:

```yaml
dataSources:
  - kind: ethereum
    name: TrustTrade
    network: base-sepolia
    source:
      address: "0x..." # Your deployed contract address
      abi: TrustTrade
      startBlock: 1234567 # Your contract deployment block
```

Get your contract address and block number from:
- **Basescan**: https://sepolia.basescan.org/

### Step 4: Generate Code

```bash
npm run codegen
```

This generates TypeScript types from your schema.

### Step 5: Build Subgraph

```bash
npm run build
```

Verify no errors occur.

### Step 6: Authenticate with The Graph Studio

```bash
graph auth --studio <YOUR_DEPLOY_KEY>
```

Get your deploy key from: https://studio.thegraph.com/subgraphs

### Step 7: Deploy to Studio

```bash
npm run deploy
```

The CLI will ask you to choose a version. Choose v1 or increment from current.

### Step 8: Verify Deployment

1. Go to https://studio.thegraph.com/subgraphs
2. Select your "trusttrade" subgraph
3. Wait 2-5 minutes for indexing to start
4. Check the "Status" tab for indexing progress

### Testing Your Subgraph

Use the embedded GraphQL Playground:

```graphql
query {
  trades(first: 5, orderBy: createdAt, orderDirection: desc) {
    id
    tradeId
    seller {
      address
    }
    status
    createdAt
  }
}
```

Copy the **Query URL** to use in your API server's `.env`:

```
SUBGRAPH_URL=https://api.studio.thegraph.com/query/YOUR_ID/trusttrade/version/latest
```

---

## Phase 2: API Server Deployment

### Step 1: Prepare Environment

Create `.env` in the `api/` directory:

```
PORT=3001
NODE_ENV=production
SUBGRAPH_URL=https://api.studio.thegraph.com/query/YOUR_ID/trusttrade/version/latest

# Firebase Configuration (see Phase 3)
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
FIRESTORE_DATABASE_ID=(default)
```

### Step 2: Deploy to Vercel (Recommended)

**Option A: Using Vercel Dashboard**

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Set root directory to `api/`
5. Add environment variables from `.env`
6. Click "Deploy"

**Option B: Using Vercel CLI**

```bash
npm install -g vercel
cd api
vercel --prod
# Follow prompts, set environment variables
```

### Step 3: Deploy to Heroku (Alternative)

1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Create Procfile in `api/`:

```
web: npm start
```

3. Deploy:

```bash
cd api
heroku login
heroku create trusttrade-api
git push heroku main
heroku config:set SUBGRAPH_URL="..." # Set environment variables
```

### Step 4: Deploy to AWS (Advanced)

Using AWS Elastic Beanstalk:

```bash
cd api
npm install -g @aws-amplify/cli

# Configure EB environment
eb init
eb create trusttrade-api-env
eb deploy
```

### Step 5: Verify Deployment

Test your API:

```bash
curl https://your-api-domain.com/api/health

# Should return:
# {"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}
```

### Step 6: Update Frontend Configuration

Update your frontend API endpoint in [lib/config.ts](../../lib/config.ts) or environment variables:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
```

---

## Phase 3: Database Setup

### Step 1: Create Firebase Project

1. Go to https://firebase.google.com
2. Click "Get Started"
3. Create a new project:
   - Name: "trusttrade"
   - Accept terms
   - Disable Google Analytics (optional)
4. Create web app
5. Copy firebaseConfig values to your `.env`

### Step 2: Set Up Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create Database"
3. Choose region: `us-central1`
4. Start in **Production Mode**
5. Click "Create"

### Step 3: Configure Security Rules

In the Firestore Rules tab, paste the security rules from [api/src/config/firestore.schema.ts](../src/config/firestore.schema.ts):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Notification Preferences
    match /notificationPreferences/{address} {
      allow read, write: if request.auth.uid == address;
    }

    // Notifications
    match /notifications/{notifId} {
      allow read: if resource.data.recipient == request.auth.uid;
      allow update: if resource.data.recipient == request.auth.uid;
    }

    // User Settings
    match /userSettings/{address} {
      allow read, write: if request.auth.uid == address;
    }

    // Other collections (backend-only)
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 4: Create Firestore Indexes

In Firestore Rules, composite indexes are needed for queries. Create them:

**Index 1: Notifications by Recipient and Date**
- Collection: `notifications`
- Fields:
  - `recipient` (Ascending)
  - `createdAt` (Descending)

**Index 2: Notifications by Recipient, Read, and Date**
- Collection: `notifications`
- Fields:
  - `recipient` (Ascending)
  - `read` (Ascending)
  - `createdAt` (Descending)

**Index 3: API Keys**
- Collection: `apiKeys`
- Fields:
  - `owner` (Ascending)
  - `active` (Ascending)

### Step 5: Enable Firestore Authentication

1. Go to "Authentication" in Firebase Console
2. Click "Get Started"
3. Enable sign-in methods:
   - ✅ Email/Password
   - ✅ Google
   - ✅ Anonymous (for testing)

### Step 6: Update API Environment Variables

Your `.env` should now have:

```
FIREBASE_API_KEY=AIzaSyD...
FIREBASE_AUTH_DOMAIN=trusttrade-xxx.firebaseapp.com
FIREBASE_PROJECT_ID=trusttrade-xxx
FIREBASE_STORAGE_BUCKET=trusttrade-xxx.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abc123...
FIRESTORE_DATABASE_ID=(default)
```

### Step 7: Verify Firestore Connection

Test from your API server:

```bash
curl -X POST https://your-api-domain.com/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "0x123...",
    "type": "trade_created",
    "title": "Test",
    "message": "Test notification"
  }'
```

Should return:
```json
{"success": true, "notificationId": "doc-id"}
```

---

## Monitoring & Maintenance

### Monitoring the Subgraph

1. Check indexing progress: https://studio.thegraph.com/subgraphs
2. Monitor query performance
3. Set up alerts for high error rates

### Monitoring the API Server

**Using Vercel:**
- Check logs: Vercel Dashboard → Project → Deployments
- Monitor performance metrics automatically

**Using Heroku:**
```bash
heroku logs --tail --remote heroku
```

**Using AWS:**
- CloudWatch Logs
- X-Ray for tracing

### Monitoring Firestore

In Firebase Console:
- Usage tab: Monitor reads/writes
- Metrics: Real-time database performance
- Set up billing alerts

### Health Checks

Set up automated health checks:

```bash
# Check API health every minute
curl --fail https://your-api-domain.com/api/health
```

### Database Cleanup

Firestore has automatic retention, but you can manually clean old data:

```bash
# Delete notifications older than 90 days
db.collection('notifications')
  .where('createdAt', '<', new Date(Date.now() - 90*24*60*60*1000))
  .get()
  .then(snap => {
    snap.docs.forEach(doc => doc.ref.delete());
  });
```

### Backup Strategy

1. **Firestore Automatic Backups**: Enabled by default
2. **Manual Exports**: Firestore → Backups → Create new backup

---

## Troubleshooting

### Subgraph Issues

**Problem**: Subgraph not indexing
- Check contract address in `subgraph.yaml`
- Check `startBlock` is correct
- Verify event handler names match contract events

**Problem**: GraphQL query returns empty
- Wait 5-10 minutes for indexing to complete
- Check Subgraph deployment logs in Studio

### API Server Issues

**Problem**: 502 Bad Gateway on Vercel
- Check API environment variables are set
- Check Subgraph URL is correct
- Check logs in Vercel Dashboard

**Problem**: Firebase authentication fails
- Verify environment variables are correctly copied
- Check Firebase project is active
- Verify Firestore is in Production Mode

### Firestore Issues

**Problem**: Permission denied errors
- Check security rules syntax
- Verify user is authenticated
- Check collection paths in rules

**Problem**: Slow queries
- Create composite indexes (Firestore will suggest)
- Add query filters to limit results
- Consider data structure redesign

---

## Cost Estimation

### The Graph Studio
- **Free**: 1 Subgraph, 100k queries/month
- **Paid**: Pay as you go ($0.00004/query)

### Firebase Firestore
- **Free**: 50k reads/day, 20k writes/day, 1GB storage
- **Paid**: ~$0.06 per 100k reads, $0.18 per 100k writes

### Vercel
- **Free**: Hobby tier, 100GB bandwidth/month
- **Pro**: $20/month

**Total Estimated Cost**: $0-50/month for low-traffic production

---

## Next Steps

1. ✅ Deploy Subgraph
2. ✅ Deploy API Server
3. ✅ Set up Firestore
4. 📍 **NEXT**: Integrate API with frontend
5. Add WebSocket for real-time updates
6. Set up monitoring and logging
7. Create admin dashboard

See [QUICKSTART.md](../../QUICKSTART.md) for frontend integration.

# TrustTrade API Documentation

## Base URL

```
http://localhost:3001/api
```

For production, replace with your deployed API endpoint.

## Authentication

Current API endpoints are public. For protected endpoints, include your wallet address in request headers:

```
X-Wallet-Address: 0x...
```

## Endpoints

### Health Check

#### GET /health

Check if the API server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Trades

### GET /trades/active

Get all active trades on the platform.

**Query Parameters:**
- `limit` (optional): Number of trades to return (default: 100, max: 1000)

**Response:**
```json
{
  "trades": [
    {
      "id": "0x...",
      "tradeId": 1,
      "seller": {
        "id": "0x...",
        "address": "0x..."
      },
      "token": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "tokenAmount": "1000000000",
      "ethPrice": "1500000000000000000",
      "feeBasisPoints": 50,
      "status": "Active",
      "createdAt": "1705308600",
      "createdBlock": "19000000"
    }
  ]
}
```

### GET /trades/user/:address

Get all trades created by a specific user.

**Parameters:**
- `address` (required): Wallet address of the seller

**Response:**
```json
{
  "trades": [
    {
      "id": "0x...",
      "tradeId": 1,
      "seller": { "id": "0x..." },
      "buyer": { "id": "0x..." },
      "token": "0x...",
      "tokenAmount": "1000000000",
      "ethPrice": "1500000000000000000",
      "status": "Completed",
      "createdAt": "1705308600"
    }
  ]
}
```

### GET /trades/:tradeId

Get detailed information about a specific trade.

**Parameters:**
- `tradeId` (required): Trade ID from the smart contract

**Response:**
```json
{
  "trade": {
    "id": "0x...",
    "tradeId": 1,
    "seller": {
      "id": "0x...",
      "address": "0x..."
    },
    "buyer": {
      "id": "0x...",
      "address": "0x..."
    },
    "token": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "tokenAmount": "1000000000",
    "ethPrice": "1500000000000000000",
    "feeBasisPoints": 50,
    "status": "Completed",
    "disputed": false,
    "createdAt": "1705308600",
    "executedAt": "1705309000",
    "escrowDuration": 86400,
    "completedAt": "1705395600"
  }
}
```

### GET /trades/:tradeId/receipt

Generate a trade receipt (PDF or JSON).

**Parameters:**
- `tradeId` (required): Trade ID from the smart contract

**Query Parameters:**
- `format` (optional): `pdf` (default) or `json`

**Response (JSON):**
```json
{
  "tradeId": 1,
  "seller": "0x...",
  "buyer": "0x...",
  "token": "USDC",
  "tokenAmount": "1000000000",
  "ethPrice": "1.5",
  "feePercentage": "0.50%",
  "totalFee": "0.0075",
  "status": "Completed",
  "createdAt": 1705308600,
  "executedAt": 1705309000,
  "completedAt": 1705395600
}
```

**Response (PDF):** Returns PDF binary stream with attachment header.

---

## Users

### GET /users/:address

Get user profile and statistics.

**Parameters:**
- `address` (required): User's wallet address

**Response:**
```json
{
  "user": {
    "id": "0x...",
    "address": "0x...",
    "profile": {
      "twitter": "@username",
      "discord": "user#1234",
      "updatedAt": "1705308600"
    },
    "totalTradesVendor": 10,
    "totalTradesBuyer": 5,
    "completedTradesVendor": 9,
    "completedTradesBuyer": 5,
    "totalVolume": "15000000000000000000",
    "averageRating": 4.8,
    "reviewCount": 12,
    "createdAt": "1704700000",
    "updatedAt": "1705308600"
  }
}
```

### GET /users/:address/stats

Get only user statistics (lighter response).

**Parameters:**
- `address` (required): User's wallet address

**Response:**
```json
{
  "user": {
    "totalTradesVendor": 10,
    "totalTradesBuyer": 5,
    "completedTradesVendor": 9,
    "completedTradesBuyer": 5,
    "totalVolume": "15000000000000000000",
    "averageRating": 4.8,
    "reviewCount": 12
  }
}
```

---

## Reviews

### GET /reviews/user/:address

Get all reviews for a specific user.

**Parameters:**
- `address` (required): User's wallet address (the reviewee)

**Query Parameters:**
- `limit` (optional): Number of reviews to return (default: 50)

**Response:**
```json
{
  "reviews": [
    {
      "id": "0x...",
      "reviewId": 1,
      "reviewer": {
        "id": "0x...",
        "address": "0x..."
      },
      "rating": 5,
      "comment": "Great seller, fast transaction!",
      "helpful": 3,
      "createdAt": "1705308600"
    }
  ]
}
```

---

## Analytics

### GET /analytics/platform

Get platform-wide statistics.

**Response:**
```json
{
  "platforms": [
    {
      "id": "1",
      "totalTrades": 1250,
      "totalVolume": "5000000000000000000000",
      "totalUsers": 450,
      "totalReviews": 3200,
      "totalDisputes": 15,
      "resolvedDisputes": 14,
      "totalEthCollected": "25000000000000000000",
      "lastUpdatedBlock": 19000000,
      "lastUpdatedTimestamp": "1705308600"
    }
  ]
}
```

---

## Notifications

### POST /notifications/preferences

Save notification preferences for a user.

**Request Body:**
```json
{
  "address": "0x...",
  "preferences": {
    "tradeCreated": true,
    "tradeExecuted": true,
    "tradeCompleted": true,
    "tradeCancelled": false,
    "reviewReceived": true,
    "disputeCreated": true,
    "emailNotifications": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preferences saved"
}
```

### GET /notifications/preferences/:address

Get notification preferences for a user.

**Parameters:**
- `address` (required): User's wallet address

**Response:**
```json
{
  "tradeCreated": true,
  "tradeExecuted": true,
  "tradeCompleted": true,
  "tradeCancelled": false,
  "reviewReceived": true,
  "disputeCreated": true,
  "emailNotifications": false,
  "updatedAt": "1705308600"
}
```

### GET /notifications/user/:address

Get all notifications for a user.

**Parameters:**
- `address` (required): User's wallet address

**Query Parameters:**
- `limit` (optional): Number of notifications to return (default: 50)

**Response:**
```json
[
  {
    "id": "doc-id-1",
    "recipient": "0x...",
    "type": "trade_created",
    "title": "New Trade Created",
    "message": "You created a trade selling 1000 USDC",
    "tradeId": "1",
    "link": "/dashboard/trades/1",
    "read": false,
    "createdAt": "1705308600"
  }
]
```

### POST /notifications

Create a new notification (internal API).

**Request Body:**
```json
{
  "recipient": "0x...",
  "type": "trade_completed",
  "title": "Trade Completed",
  "message": "Your trade #1 has been completed successfully",
  "tradeId": "1",
  "link": "/dashboard/trades/1"
}
```

**Response:**
```json
{
  "success": true,
  "notificationId": "doc-id"
}
```

### PATCH /notifications/:notificationId/read

Mark a notification as read.

**Parameters:**
- `notificationId` (required): Notification document ID

**Response:**
```json
{
  "success": true
}
```

---

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Failed to fetch trades"
}
```

**HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (missing/invalid parameters)
- `404`: Not Found
- `500`: Server Error

---

## Rate Limiting

Currently no rate limiting is enforced. For production deployments, implement:

```
- 100 requests per minute for public endpoints
- 1000 requests per minute for authenticated users
- 10,000 requests per minute for API key holders
```

---

## Pagination

For endpoints returning arrays, pagination is not yet implemented but can be added with:

```
?page=1&limit=50&offset=0
```

---

## WebSocket (Future)

Real-time trade updates will be available via WebSocket:

```
ws://localhost:3001/ws
```

Subscribe to events:
```json
{
  "type": "subscribe",
  "channel": "trades:active"
}
```

---

## Example Usage

### JavaScript/TypeScript

```typescript
// Fetch active trades
const response = await fetch('http://localhost:3001/api/trades/active');
const data = await response.json();
console.log(data.trades);

// Get user stats
const userStats = await fetch('http://localhost:3001/api/users/0x.../stats');
const stats = await userStats.json();
console.log(stats.user.totalTradesVendor);

// Get trade receipt as PDF
const receipt = await fetch('http://localhost:3001/api/trades/1/receipt?format=pdf');
const blob = await receipt.blob();
// Save blob as file
```

### cURL

```bash
# Get active trades
curl http://localhost:3001/api/trades/active

# Get user stats
curl http://localhost:3001/api/users/0x.../stats

# Save trade receipt
curl http://localhost:3001/api/trades/1/receipt > receipt.pdf
```

---

## Environment Variables

Create a `.env` file in the `api/` directory:

```
PORT=3001
NODE_ENV=development
SUBGRAPH_URL=https://api.studio.thegraph.com/query/YOUR_ID/trusttrade/version/latest

# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIRESTORE_DATABASE_ID=(default)
```

---

## Deployment

### Local Development

```bash
cd api
npm install
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

---

## Future Enhancements

- [ ] JWT Authentication
- [ ] Rate limiting per API key
- [ ] Pagination support
- [ ] WebSocket for real-time updates
- [ ] Advanced filtering and search
- [ ] Data export (CSV, JSON)
- [ ] Webhook integrations
- [ ] caching layer (Redis)
- [ ] API analytics and monitoring
- [ ] GraphQL endpoint

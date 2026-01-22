# TrustTrade Backend - Quick Start Guide

Get the TrustTrade backend running locally in 5 minutes.

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org))
- npm 9+ (comes with Node.js)
- Git (for cloning)
- Firebase account (free tier available)

## Step 1: Set Up Environment Variables

### For API Server

Create `api/.env`:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# The Graph Subgraph URL (start with placeholder, update after deployment)
SUBGRAPH_URL=https://api.studio.thegraph.com/query/YOUR_ID/trusttrade/version/latest

# Firebase Configuration (Get from Firebase Console)
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIRESTORE_DATABASE_ID=(default)
```

### For Frontend

Create or update `.env.local`:

```bash
# API Server URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Step 2: Install Dependencies

```bash
# Install API dependencies
cd api
npm install

# Go back to root
cd ..
```

## Step 3: Start API Server

```bash
# From the api directory
cd api
npm run dev

# You should see:
# 🚀 TrustTrade API Server running on port 3001
# 📊 Subgraph: https://api.studio.thegraph.com/query/...
```

## Step 4: Test the API

Open a new terminal and test endpoints:

```bash
# Check health
curl http://localhost:3001/api/health

# Should return:
# {"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}

# Get active trades (will be empty until Subgraph is deployed)
curl http://localhost:3001/api/trades/active

# Get platform analytics
curl http://localhost:3001/api/analytics/platform
```

## Step 5: Run Frontend

In another terminal:

```bash
# From project root
npm run dev

# Navigate to http://localhost:3000
```

---

## API Endpoints

Once running locally, you can test these endpoints:

### Trades
- `GET http://localhost:3001/api/trades/active` - Get active trades
- `GET http://localhost:3001/api/trades/user/0x...` - Get user's trades
- `GET http://localhost:3001/api/trades/1` - Get trade #1
- `GET http://localhost:3001/api/trades/1/receipt` - Get trade receipt

### Users
- `GET http://localhost:3001/api/users/0x...` - Get user profile
- `GET http://localhost:3001/api/users/0x.../stats` - Get user stats

### Reviews
- `GET http://localhost:3001/api/reviews/user/0x...` - Get user reviews

### Notifications
- `GET http://localhost:3001/api/notifications/user/0x...` - Get user notifications
- `GET http://localhost:3001/api/notifications/preferences/0x...` - Get preferences

### Analytics
- `GET http://localhost:3001/api/analytics/platform` - Get platform stats

---

## Using Postman

1. Download [Postman](https://postman.com)
2. Import the requests from `api/API_DOCS.md`
3. Create environment variables:
   - `api_url`: `http://localhost:3001/api`
   - `user_address`: Your wallet address
4. Test each endpoint

---

## Frontend Integration

Once the API is running, use it in your React components:

```typescript
import { apiClient } from '@/lib/api';
import { useApi } from '@/hooks/useApi';

export function TradeFeed() {
  const { data, loading } = useApi(
    () => apiClient.getActiveTrades(),
    [],
    { refetchInterval: 30000 } // Refresh every 30 seconds
  );

  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {data?.trades.map(trade => (
        <div key={trade.id}>
          <p>Trade #{trade.tradeId}</p>
          <p>Status: {trade.status}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Troubleshooting

### API won't start
```bash
# Check if port 3001 is in use
lsof -i :3001  # On Mac/Linux
netstat -ano | findstr :3001  # On Windows

# Kill the process or use different port
PORT=3002 npm run dev
```

### Database connection error
- Check Firebase credentials in `.env`
- Verify Firestore database is created
- Check internet connection

### Empty trades/users
- Subgraph not yet deployed (normal for local dev)
- Use test data in Firestore instead
- See DEPLOYMENT.md to deploy Subgraph

### CORS errors
- Make sure `NEXT_PUBLIC_API_URL` matches API server URL
- Check CORS is enabled in `api/src/server.ts`

---

## Building for Production

### Build API
```bash
cd api
npm run build
npm start
```

### Build Frontend
```bash
npm run build
npm start
```

---

## File Structure

```
trusttrade/
├── api/                    # Backend API Server
│   ├── src/
│   │   ├── server.ts      # Express server (14 endpoints)
│   │   ├── services/
│   │   │   └── pdfService.ts
│   │   └── config/
│   │       └── firebase.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── API_DOCS.md        # API reference
├── lib/
│   └── api.ts             # API client library
├── hooks/
│   └── useApi.ts          # React hook for API calls
├── DEPLOYMENT.md          # Deployment guide
├── FRONTEND_INTEGRATION.md # Component integration
└── BACKEND_SUMMARY.md     # Architecture overview
```

---

## Common Tasks

### Add a new API endpoint

1. Add handler to `api/src/server.ts`:
```typescript
app.get('/api/newfeature', async (req, res) => {
  try {
    // Your code here
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});
```

2. Add client method to `lib/api.ts`:
```typescript
async getNewFeature() {
  return this.request('/newfeature');
}
```

3. Use in component:
```typescript
const { data } = useApi(() => apiClient.getNewFeature());
```

### Change API port

Option 1: Environment variable
```bash
PORT=3002 npm run dev
```

Option 2: Update `.env`:
```
PORT=3002
```

### Connect to different database

1. Create new Firebase project
2. Update environment variables
3. Update Firestore security rules
4. Restart API server

---

## Performance Tips

1. **Caching**: API automatically caches responses via browser
2. **Pagination**: Add `limit` parameter to queries
3. **Lazy Loading**: Load data only when needed
4. **Compression**: API automatically compresses responses
5. **CDN**: Deploy to Vercel for automatic CDN

---

## Security Checklist

- [ ] Never commit `.env` to Git
- [ ] Use `.env.example` as template
- [ ] Rotate Firebase keys regularly
- [ ] Enable Firestore security rules
- [ ] Use HTTPS in production
- [ ] Set up rate limiting
- [ ] Monitor API usage

---

## Next Steps

1. ✅ **API Server Running** - You are here
2. 📍 **Deploy Subgraph** - See DEPLOYMENT.md
3. Create Firebase project - See DEPLOYMENT.md
4. Integrate with frontend - See FRONTEND_INTEGRATION.md
5. Deploy to production - See DEPLOYMENT.md

---

## Quick Reference

| Task | Command |
|------|---------|
| Start API | `cd api && npm run dev` |
| Build API | `cd api && npm run build` |
| Test API | `curl http://localhost:3001/api/health` |
| Start Frontend | `npm run dev` |
| View API Docs | See `api/API_DOCS.md` |
| Deployment Help | See `DEPLOYMENT.md` |
| Integration Guide | See `FRONTEND_INTEGRATION.md` |

---

## Getting Help

- **API Issues**: Check `api/API_DOCS.md`
- **Deployment Issues**: Check `DEPLOYMENT.md`
- **Frontend Integration**: Check `FRONTEND_INTEGRATION.md`
- **Architecture**: Check `BACKEND_SUMMARY.md`
- **Environment**: Check `api/.env.example`

---

## Additional Resources

- [Express.js Docs](https://expressjs.com)
- [Firebase Docs](https://firebase.google.com/docs)
- [The Graph Docs](https://thegraph.com/docs)
- [REST API Best Practices](https://restfulapi.net)

---

Happy coding! 🚀

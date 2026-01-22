# Frontend Integration Guide

Guide for integrating the TrustTrade API endpoints into the frontend React components.

## Setup

### 1. Add API Configuration

Create or update [lib/api.ts](../lib/api.ts):

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiClient = {
  // Trades
  async getActiveTrades() {
    const res = await fetch(`${API_BASE}/trades/active`);
    if (!res.ok) throw new Error('Failed to fetch active trades');
    return res.json();
  },

  async getUserTrades(address: string) {
    const res = await fetch(`${API_BASE}/trades/user/${address}`);
    if (!res.ok) throw new Error('Failed to fetch user trades');
    return res.json();
  },

  async getTrade(tradeId: string) {
    const res = await fetch(`${API_BASE}/trades/${tradeId}`);
    if (!res.ok) throw new Error('Failed to fetch trade');
    return res.json();
  },

  async getTradeReceipt(tradeId: string, format: 'pdf' | 'json' = 'json') {
    const res = await fetch(`${API_BASE}/trades/${tradeId}/receipt?format=${format}`);
    if (!res.ok) throw new Error('Failed to fetch receipt');
    if (format === 'json') {
      return res.json();
    }
    return res.blob();
  },

  // Users
  async getUser(address: string) {
    const res = await fetch(`${API_BASE}/users/${address}`);
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async getUserStats(address: string) {
    const res = await fetch(`${API_BASE}/users/${address}/stats`);
    if (!res.ok) throw new Error('Failed to fetch user stats');
    return res.json();
  },

  // Reviews
  async getUserReviews(address: string, limit = 50) {
    const res = await fetch(`${API_BASE}/reviews/user/${address}?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
  },

  // Analytics
  async getPlatformStats() {
    const res = await fetch(`${API_BASE}/analytics/platform`);
    if (!res.ok) throw new Error('Failed to fetch platform stats');
    return res.json();
  },

  // Notifications
  async getNotifications(address: string, limit = 50) {
    const res = await fetch(`${API_BASE}/notifications/user/${address}?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async setNotificationPreferences(address: string, preferences: any) {
    const res = await fetch(`${API_BASE}/notifications/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, preferences }),
    });
    if (!res.ok) throw new Error('Failed to save preferences');
    return res.json();
  },

  async getNotificationPreferences(address: string) {
    const res = await fetch(`${API_BASE}/notifications/preferences/${address}`);
    if (!res.ok) throw new Error('Failed to fetch preferences');
    return res.json();
  },

  async markNotificationAsRead(notificationId: string) {
    const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to update notification');
    return res.json();
  },
};
```

### 2. Create React Hook for API Data

Create [hooks/useApi.ts](../hooks/useApi.ts):

```typescript
import { useState, useEffect } from 'react';

interface UseApiOptions {
  skip?: boolean;
  refetchInterval?: number;
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  dependencies: any[] = [],
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (options.skip) return;

    let isMounted = true;
    let interval: NodeJS.Timeout;

    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await fetcher();
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Set up refetch interval if specified
    if (options.refetchInterval) {
      interval = setInterval(fetchData, options.refetchInterval);
    }

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, dependencies);

  return { data, loading, error };
}
```

### 3. Update Environment Variables

Add to [.env.local](../.env.local):

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
# For production:
# NEXT_PUBLIC_API_URL=https://api.trusttrade.com/api
```

---

## Component Integration Examples

### TradeFeed Component

Update [components/TradeFeed.tsx](../components/TradeFeed.tsx) to use API:

```typescript
import { apiClient } from '@/lib/api';
import { useApi } from '@/hooks/useApi';

export function TradeFeed() {
  const { data, loading, error } = useApi(
    () => apiClient.getActiveTrades(),
    [],
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );

  if (loading) return <div>Loading trades...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-4">
      {data?.trades.map((trade: any) => (
        <TradeCard key={trade.id} trade={trade} />
      ))}
    </div>
  );
}
```

### UserProfile Component

```typescript
import { apiClient } from '@/lib/api';
import { useApi } from '@/hooks/useApi';

export function UserProfile({ address }: { address: string }) {
  const { data: user, loading } = useApi(
    () => apiClient.getUser(address),
    [address]
  );

  const { data: reviews } = useApi(
    () => apiClient.getUserReviews(address),
    [address]
  );

  if (loading) return <div>Loading profile...</div>;

  return (
    <div>
      <h2>{user?.user.address}</h2>
      <div>
        <p>Trades: {user?.user.totalTradesVendor}</p>
        <p>Rating: {user?.user.averageRating}</p>
        <p>Reviews: {user?.user.reviewCount}</p>
      </div>
      <div className="reviews">
        {reviews?.reviews.map((review: any) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}
```

### Notifications Component

```typescript
import { apiClient } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useAccount } from 'wagmi';
import { useState } from 'react';

export function NotificationsDropdown() {
  const { address } = useAccount();
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: notifications } = useApi(
    () => address ? apiClient.getNotifications(address) : Promise.resolve([]),
    [address],
    { refetchInterval: 5000 } // Check every 5 seconds
  );

  const handleNotificationClick = async (notificationId: string) => {
    await apiClient.markNotificationAsRead(notificationId);
    // Refetch notifications
  };

  return (
    <div className="dropdown">
      <button className="relative">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      <div className="dropdown-content">
        {notifications?.map((notif: any) => (
          <div
            key={notif.id}
            className={`notification ${notif.read ? 'read' : 'unread'}`}
            onClick={() => handleNotificationClick(notif.id)}
          >
            <h4>{notif.title}</h4>
            <p>{notif.message}</p>
            <small>{new Date(notif.createdAt).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Download Trade Receipt

```typescript
import { apiClient } from '@/lib/api';

export async function downloadTradeReceipt(tradeId: string) {
  try {
    const blob = await apiClient.getTradeReceipt(tradeId, 'pdf');
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-${tradeId}-receipt.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Failed to download receipt:', error);
  }
}

// Usage in a component:
<button onClick={() => downloadTradeReceipt(trade.id)}>
  📥 Download Receipt
</button>
```

---

## Data Flow Diagram

```
Frontend Components
        ↓
   useApi Hook (caching, refetching)
        ↓
   apiClient (fetch wrapper)
        ↓
   API Server (Express.js)
        ↓
   GraphQL Client
        ↓
   The Graph Subgraph
        ↓
   Blockchain Events
```

---

## Performance Optimization

### 1. Caching

Add React Query or SWR for automatic caching:

```bash
npm install @tanstack/react-query
```

```typescript
import { useQuery } from '@tanstack/react-query';

export function useTrades() {
  return useQuery({
    queryKey: ['trades', 'active'],
    queryFn: () => apiClient.getActiveTrades(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}
```

### 2. Pagination

For large lists, implement pagination:

```typescript
const [page, setPage] = useState(1);
const limit = 20;

const { data } = useApi(
  () => apiClient.getUserTrades(address, page, limit),
  [address, page]
);
```

### 3. Lazy Loading

Load data only when needed:

```typescript
const [showDetails, setShowDetails] = useState(false);
const { data: details } = useApi(
  () => apiClient.getTrade(tradeId),
  [tradeId],
  { skip: !showDetails }
);
```

---

## Error Handling

Implement comprehensive error handling:

```typescript
export function useSafeApi<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  dependencies: any[] = []
) {
  const { data = fallback, error } = useApi(fetcher, dependencies);

  if (error) {
    console.error('API Error:', error);
    // Show toast notification
    showToast({
      type: 'error',
      message: 'Failed to load data. Using cached version.',
    });
  }

  return data;
}
```

---

## Testing API Endpoints

### Using cURL

```bash
# Test API is running
curl http://localhost:3001/api/health

# Get active trades
curl http://localhost:3001/api/trades/active | jq

# Get user stats
curl http://localhost:3001/api/users/0x.../stats | jq
```

### Using Postman

1. Import API endpoints from [API_DOCS.md](./API_DOCS.md)
2. Set up environment variables for URL and addresses
3. Create test collection for regression testing

### Using Playwright/Cypress

```typescript
// tests/api.spec.ts
test('API returns active trades', async () => {
  const response = await fetch('http://localhost:3001/api/trades/active');
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.trades).toBeDefined();
});
```

---

## Deployment Checklist

- [ ] Update `NEXT_PUBLIC_API_URL` in production `.env`
- [ ] Test API endpoints from production frontend
- [ ] Set up monitoring for API performance
- [ ] Create alerting for API failures
- [ ] Document any API key requirements
- [ ] Set up CORS properly for production domain
- [ ] Test file downloads (receipts) in production
- [ ] Verify Firestore security rules work as expected

---

## Next Steps

1. ✅ Create API client utilities
2. ✅ Create React hooks for API calls
3. Update components to use API data
4. Add error handling and loading states
5. Implement pagination for large lists
6. Add WebSocket for real-time updates
7. Set up API monitoring and alerting

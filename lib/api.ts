/**
 * TrustTrade API Client
 * 
 * Provides typed methods for interacting with the TrustTrade backend API.
 * All endpoints return JSON responses unless otherwise specified.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Trade {
  id: string;
  tradeId: number;
  seller: {
    id: string;
    address: string;
  };
  buyer?: {
    id: string;
    address: string;
  };
  token: string;
  tokenAmount: string;
  ethPrice: string;
  feeBasisPoints: number;
  status: 'Active' | 'Escrow' | 'Completed' | 'Cancelled';
  disputed: boolean;
  createdAt: string;
  executedAt?: string;
  escrowDuration?: number;
  completedAt?: string;
}

export interface User {
  id: string;
  address: string;
  profile?: {
    twitter?: string;
    discord?: string;
    updatedAt: string;
  };
  totalTradesVendor: number;
  totalTradesBuyer: number;
  completedTradesVendor: number;
  completedTradesBuyer: number;
  totalVolume: string;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  reviewId: number;
  reviewer: {
    id: string;
    address: string;
  };
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  helpful: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  recipient: string;
  type: 'trade_created' | 'trade_executed' | 'trade_completed' | 'review_received' | 'dispute_created';
  title: string;
  message: string;
  tradeId?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  tradeCreated: boolean;
  tradeExecuted: boolean;
  tradeCompleted: boolean;
  tradeCancelled: boolean;
  reviewReceived: boolean;
  disputeCreated: boolean;
  emailNotifications: boolean;
  updatedAt?: string;
}

export interface PlatformStats {
  id: string;
  totalTrades: number;
  totalVolume: string;
  totalUsers: number;
  totalReviews: number;
  totalDisputes: number;
  resolvedDisputes: number;
  totalEthCollected: string;
  lastUpdatedBlock: string;
  lastUpdatedTimestamp: string;
}

export interface TradeReceipt {
  tradeId: number;
  seller: string;
  buyer: string;
  token: string;
  tokenAmount: string;
  ethPrice: string;
  feePercentage: string;
  totalFee: string;
  status: string;
  createdAt: number;
  executedAt?: number;
  completedAt?: number;
}

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  private async requestBlob(endpoint: string, options: RequestInit = {}): Promise<Blob> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.blob();
  }

  // ==================== TRADES ====================

  async getActiveTrades(): Promise<{ trades: Trade[] }> {
    return this.request('/trades/active');
  }

  async getUserTrades(address: string): Promise<{ trades: Trade[] }> {
    return this.request(`/trades/user/${address}`);
  }

  async getTrade(tradeId: string): Promise<{ trade: Trade }> {
    return this.request(`/trades/${tradeId}`);
  }

  async getTradeReceipt(tradeId: string, format: 'json' | 'pdf' = 'json'): Promise<TradeReceipt | Blob> {
    if (format === 'json') {
      const response = await this.request<{ tradeReceipt: TradeReceipt }>(`/trades/${tradeId}/receipt?format=json`);
      return response.tradeReceipt;
    }
    return this.requestBlob(`/trades/${tradeId}/receipt?format=pdf`);
  }

  async downloadTradeReceipt(tradeId: string, fileName?: string): Promise<void> {
    const blob = await this.getTradeReceipt(tradeId, 'pdf') as Blob;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `trade-${tradeId}-receipt.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // ==================== USERS ====================

  async getUser(address: string): Promise<{ user: User }> {
    return this.request(`/users/${address}`);
  }

  async getUserStats(address: string): Promise<{ user: Partial<User> }> {
    return this.request(`/users/${address}/stats`);
  }

  // ==================== REVIEWS ====================

  async getUserReviews(address: string, limit: number = 50): Promise<{ reviews: Review[] }> {
    return this.request(`/reviews/user/${address}?limit=${limit}`);
  }

  // ==================== ANALYTICS ====================

  async getPlatformStats(): Promise<{ platforms: PlatformStats[] }> {
    return this.request('/analytics/platform');
  }

  // ==================== NOTIFICATIONS ====================

  async getNotifications(address: string, limit: number = 50): Promise<Notification[]> {
    return this.request(`/notifications/user/${address}?limit=${limit}`);
  }

  async getNotificationPreferences(address: string): Promise<NotificationPreferences> {
    return this.request(`/notifications/preferences/${address}`);
  }

  async setNotificationPreferences(
    address: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<{ success: boolean; message: string }> {
    return this.request('/notifications/preferences', {
      method: 'POST',
      body: JSON.stringify({ address, preferences }),
    });
  }

  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async createNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<{ success: boolean; notificationId: string }> {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }

  // ==================== HEALTH ====================

  async health(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }
}

export const apiClient = new APIClient(API_BASE);

export default apiClient;

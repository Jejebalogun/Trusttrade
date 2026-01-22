/**
 * Firestore Schema Configuration for TrustTrade
 * 
 * This file documents the expected Firestore collections and their structure.
 * Use this as a reference for setting up security rules and creating indexes.
 */

// ==================== COLLECTIONS ====================

/**
 * notificationPreferences/{address}
 * Stores notification settings for each user
 * 
 * Document ID: User's wallet address (lowercase)
 */
interface NotificationPreferences {
  tradeCreated: boolean;
  tradeExecuted: boolean;
  tradeCompleted: boolean;
  tradeCancelled: boolean;
  reviewReceived: boolean;
  disputeCreated: boolean;
  emailNotifications: boolean;
  updatedAt: string; // ISO timestamp
}

/**
 * notifications/{docId}
 * Stores user notifications (activity feed)
 * 
 * Document ID: Auto-generated
 */
interface Notification {
  recipient: string; // User's wallet address (lowercase)
  type: 'trade_created' | 'trade_executed' | 'trade_completed' | 'review_received' | 'dispute_created';
  title: string; // e.g., "New Trade Created"
  message: string; // e.g., "You created a trade selling 1000 USDC"
  tradeId?: string; // Related trade ID (optional)
  link?: string; // Deep link to view trade/review
  read: boolean;
  createdAt: string; // ISO timestamp
}

/**
 * tradeReceipts/{tradeId}
 * Stores metadata about generated trade receipts (for caching)
 * 
 * Document ID: Trade ID from smart contract
 */
interface TradeReceipt {
  tradeId: string;
  seller: string;
  buyer: string;
  status: string;
  pdfUrl?: string; // Optional: stored PDF URL for serving
  generatedAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp (e.g., 30 days from generation)
}

/**
 * userSettings/{address}
 * Stores user application settings and API configuration
 * 
 * Document ID: User's wallet address (lowercase)
 */
interface UserSettings {
  address: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string; // Display currency (USD, EUR, etc.)
  apiKeyHash?: string; // Hashed API key for external integrations
  twoFactorEnabled: boolean;
  defaultEscrowDuration: number; // in days
  autoAcceptTrades: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * auditLogs/{docId}
 * Stores audit trail for security purposes
 * 
 * Document ID: Auto-generated
 */
interface AuditLog {
  address: string;
  action: string; // e.g., 'trade_created', 'dispute_initiated'
  details: Record<string, any>;
  timestamp: string; // ISO timestamp
  ipAddress?: string;
  userAgent?: string;
}

/**
 * blocklist/{address}
 * Stores blocked users
 * 
 * Document ID: Blocked user's wallet address (lowercase)
 */
interface BlocklistEntry {
  blockedBy: string; // Address of user who blocked
  reason?: string;
  createdAt: string;
}

/**
 * apiKeys/{docId}
 * Stores API keys for external integrations
 * 
 * Document ID: Auto-generated
 */
interface ApiKey {
  owner: string; // User's wallet address
  keyHash: string; // Hashed API key
  name: string; // e.g., "Trading Bot"
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  rateLimit: number; // requests per hour
  active: boolean;
}

// ==================== FIRESTORE SECURITY RULES ====================

/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper to get authenticated user
    function isAuthed() {
      return request.auth != null;
    }

    function userAddress() {
      return request.auth.uid;
    }

    // Notification Preferences: Users can only read/write their own
    match /notificationPreferences/{address} {
      allow read, write: if userAddress() == address;
    }

    // Notifications: Users can only read their own
    match /notifications/{notifId} {
      allow read: if resource.data.recipient == userAddress();
      allow update: if resource.data.recipient == userAddress() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);
      allow delete: if resource.data.recipient == userAddress();
    }

    // Trade Receipts: Anyone can read, only receipts related to user's trades
    match /tradeReceipts/{tradeId} {
      allow read: if true;
      allow write: if false; // Only backend writes
    }

    // User Settings: Users can only read/write their own
    match /userSettings/{address} {
      allow read: if userAddress() == address;
      allow write: if userAddress() == address && request.resource.data.address == address;
    }

    // Audit Logs: Only backend writes
    match /auditLogs/{logId} {
      allow read: if false;
      allow write: if false; // Only backend writes
    }

    // Blocklist: Users can manage their own blocklist
    match /blocklist/{blockedAddress} {
      allow read: if userAddress() == get(/databases/$(database)/documents/blocklist/$(blockedAddress)).data.blockedBy;
      allow write: if false; // Only backend manages blocklist
    }

    // API Keys: Users can read their own keys, backend manages writes
    match /apiKeys/{keyId} {
      allow read: if resource.data.owner == userAddress();
      allow write: if false; // Only backend writes
    }
  }
}
*/

// ==================== COMPOSITE INDEXES ====================

/*
Collection: notifications
- Field: recipient (Ascending)
- Field: createdAt (Descending)

Collection: notifications
- Field: recipient (Ascending)
- Field: read (Ascending)
- Field: createdAt (Descending)

Collection: apiKeys
- Field: owner (Ascending)
- Field: active (Ascending)
- Field: createdAt (Descending)

Collection: auditLogs
- Field: address (Ascending)
- Field: timestamp (Descending)
*/

export {};

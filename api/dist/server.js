"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const graphql_request_1 = require("graphql-request");
const firebase_1 = require("./config/firebase");
const firestore_1 = require("firebase/firestore");
const pdfService_1 = require("./services/pdfService");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// GraphQL Client for The Graph
const graphqlClient = new graphql_request_1.GraphQLClient(process.env.SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/YOUR_ID/trusttrade/version/latest');
// ==================== TRADES ====================
// Get all active trades
app.get('/api/trades/active', async (req, res) => {
    try {
        const query = (0, graphql_request_1.gql) `
      query {
        trades(where: { status: "Active" }, orderBy: createdAt, orderDirection: desc, first: 100) {
          id
          tradeId
          seller {
            id
            address
          }
          token
          tokenAmount
          ethPrice
          feeBasisPoints
          status
          createdAt
          createdBlock
        }
      }
    `;
        const data = await graphqlClient.request(query);
        res.json(data);
    }
    catch (error) {
        console.error('Error fetching trades:', error);
        res.status(500).json({ error: 'Failed to fetch trades' });
    }
});
// Get trades by user
app.get('/api/trades/user/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const query = (0, graphql_request_1.gql) `
      query {
        trades(where: { seller: "${address.toLowerCase()}" }, first: 100) {
          id
          tradeId
          seller {
            id
          }
          buyer {
            id
          }
          token
          tokenAmount
          ethPrice
          status
          createdAt
        }
      }
    `;
        const data = await graphqlClient.request(query);
        res.json(data);
    }
    catch (error) {
        console.error('Error fetching user trades:', error);
        res.status(500).json({ error: 'Failed to fetch user trades' });
    }
});
// Get trade by ID
app.get('/api/trades/:tradeId', async (req, res) => {
    try {
        const { tradeId } = req.params;
        const query = (0, graphql_request_1.gql) `
      query {
        trade(id: "${tradeId}") {
          id
          tradeId
          seller {
            id
            address
          }
          buyer {
            id
            address
          }
          token
          tokenAmount
          ethPrice
          feeBasisPoints
          status
          disputed
          createdAt
          executedAt
          escrowDuration
          completedAt
        }
      }
    `;
        const data = await graphqlClient.request(query);
        res.json(data);
    }
    catch (error) {
        console.error('Error fetching trade:', error);
        res.status(500).json({ error: 'Failed to fetch trade' });
    }
});
// ==================== USERS ====================
// Get user profile
app.get('/api/users/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const query = (0, graphql_request_1.gql) `
      query {
        user(id: "${address.toLowerCase()}") {
          id
          address
          profile {
            twitter
            discord
            updatedAt
          }
          totalTradesVendor
          totalTradesBuyer
          completedTradesVendor
          completedTradesBuyer
          totalVolume
          averageRating
          reviewCount
          createdAt
          updatedAt
        }
      }
    `;
        const data = await graphqlClient.request(query);
        res.json(data);
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});
// Get user statistics
app.get('/api/users/:address/stats', async (req, res) => {
    try {
        const { address } = req.params;
        const query = (0, graphql_request_1.gql) `
      query {
        user(id: "${address.toLowerCase()}") {
          totalTradesVendor
          totalTradesBuyer
          completedTradesVendor
          completedTradesBuyer
          totalVolume
          averageRating
          reviewCount
        }
      }
    `;
        const data = await graphqlClient.request(query);
        res.json(data);
    }
    catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ error: 'Failed to fetch user stats' });
    }
});
// ==================== REVIEWS ====================
// Get reviews for a user
app.get('/api/reviews/user/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const query = (0, graphql_request_1.gql) `
      query {
        reviews(where: { reviewee: "${address.toLowerCase()}" }, orderBy: createdAt, orderDirection: desc, first: 50) {
          id
          reviewId
          reviewer {
            id
            address
          }
          rating
          comment
          helpful
          createdAt
        }
      }
    `;
        const data = await graphqlClient.request(query);
        res.json(data);
    }
    catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});
// ==================== ANALYTICS ====================
// Get platform statistics
app.get('/api/analytics/platform', async (req, res) => {
    try {
        const query = (0, graphql_request_1.gql) `
      query {
        platforms(first: 1) {
          id
          totalTrades
          totalVolume
          totalUsers
          totalReviews
          totalDisputes
          resolvedDisputes
          totalEthCollected
          lastUpdatedBlock
          lastUpdatedTimestamp
        }
      }
    `;
        const data = await graphqlClient.request(query);
        res.json(data);
    }
    catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});
// ==================== TRADE RECEIPTS ====================
// Get trade receipt as PDF
app.get('/api/trades/:tradeId/receipt', async (req, res) => {
    try {
        const { tradeId } = req.params;
        const { format } = req.query;
        // Fetch trade data from Subgraph
        const tradeQuery = (0, graphql_request_1.gql) `
      query {
        trade(id: "${tradeId}") {
          tradeId
          seller { address }
          buyer { address }
          token
          tokenAmount
          ethPrice
          feeBasisPoints
          status
          createdAt
          executedAt
          completedAt
        }
      }
    `;
        const tradeData = await graphqlClient.request(tradeQuery);
        const trade = tradeData.trade;
        if (!trade) {
            return res.status(404).json({ error: 'Trade not found' });
        }
        // Calculate total fee
        const tokenAmountBN = BigInt(trade.tokenAmount);
        const ethPriceBN = BigInt(trade.ethPrice);
        const totalEth = tokenAmountBN * ethPriceBN / BigInt(10 ** 18);
        const fee = totalEth * BigInt(trade.feeBasisPoints) / BigInt(10000);
        const receiptData = {
            tradeId: trade.tradeId,
            seller: trade.seller.address,
            buyer: trade.buyer?.address || 'Pending',
            token: trade.token,
            tokenAmount: trade.tokenAmount,
            ethPrice: trade.ethPrice,
            feePercentage: `${(trade.feeBasisPoints / 100).toFixed(2)}%`,
            totalFee: fee.toString(),
            status: trade.status,
            createdAt: parseInt(trade.createdAt),
            executedAt: trade.executedAt ? parseInt(trade.executedAt) : undefined,
            completedAt: trade.completedAt ? parseInt(trade.completedAt) : undefined,
        };
        if (format === 'json') {
            res.json(receiptData);
        }
        else {
            // Default to PDF
            const pdfStream = (0, pdfService_1.generateTradeReceipt)(receiptData);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="trusttrade-receipt-${tradeId}.pdf"`);
            pdfStream.pipe(res);
        }
    }
    catch (error) {
        console.error('Error generating receipt:', error);
        res.status(500).json({ error: 'Failed to generate receipt' });
    }
});
// ==================== NOTIFICATIONS ====================
// Save notification preferences
app.post('/api/notifications/preferences', async (req, res) => {
    try {
        const { address, preferences } = req.body;
        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }
        const prefsRef = (0, firestore_1.doc)(firebase_1.db, 'notificationPreferences', address.toLowerCase());
        await (0, firestore_1.setDoc)(prefsRef, {
            ...preferences,
            updatedAt: new Date().toISOString(),
        }, { merge: true });
        res.json({ success: true, message: 'Preferences saved' });
    }
    catch (error) {
        console.error('Error saving preferences:', error);
        res.status(500).json({ error: 'Failed to save preferences' });
    }
});
// Get notification preferences
app.get('/api/notifications/preferences/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const prefsRef = (0, firestore_1.doc)(firebase_1.db, 'notificationPreferences', address.toLowerCase());
        const prefsSnap = await (0, firestore_1.getDoc)(prefsRef);
        if (prefsSnap.exists()) {
            res.json(prefsSnap.data());
        }
        else {
            // Return default preferences
            res.json({
                tradeCreated: true,
                tradeExecuted: true,
                tradeCompleted: true,
                tradeCancelled: false,
                reviewReceived: true,
                disputeCreated: true,
                emailNotifications: false,
            });
        }
    }
    catch (error) {
        console.error('Error fetching preferences:', error);
        res.status(500).json({ error: 'Failed to fetch preferences' });
    }
});
// Get user notifications
app.get('/api/notifications/user/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const { limit = 50 } = req.query;
        const notificationsRef = (0, firestore_1.collection)(firebase_1.db, 'notifications');
        const q = (0, firestore_1.query)(notificationsRef, (0, firestore_1.where)('recipient', '==', address.toLowerCase()));
        const snapshot = await (0, firestore_1.getDocs)(q);
        const notifications = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, parseInt(limit));
        res.json(notifications);
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});
// Create a notification (internal use)
app.post('/api/notifications', async (req, res) => {
    try {
        const { recipient, type, title, message, tradeId, link } = req.body;
        if (!recipient || !type) {
            return res.status(400).json({ error: 'Recipient and type are required' });
        }
        const notificationsRef = (0, firestore_1.collection)(firebase_1.db, 'notifications');
        const docRef = await (0, firestore_1.addDoc)(notificationsRef, {
            recipient: recipient.toLowerCase(),
            type,
            title,
            message,
            tradeId,
            link,
            read: false,
            createdAt: new Date().toISOString(),
        });
        res.json({ success: true, notificationId: docRef.id });
    }
    catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
});
// Mark notification as read
app.patch('/api/notifications/:notificationId/read', async (req, res) => {
    try {
        const { notificationId } = req.params;
        const notifRef = (0, firestore_1.doc)(firebase_1.db, 'notifications', notificationId);
        await (0, firestore_1.updateDoc)(notifRef, { read: true });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});
// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 TrustTrade API Server running on port ${PORT}`);
    console.log(`📊 Subgraph: ${process.env.SUBGRAPH_URL}`);
});
//# sourceMappingURL=server.js.map
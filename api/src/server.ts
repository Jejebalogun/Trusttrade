import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GraphQLClient, gql } from 'graphql-request';
import { db } from './config/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { generateTradeReceipt } from './services/pdfService';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// GraphQL Client for The Graph
const graphqlClient = new GraphQLClient(
  process.env.SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/YOUR_ID/trusttrade/version/latest'
);

// ==================== TRADES ====================

// Get all active trades
app.get('/api/trades/active', async (req: Request, res: Response) => {
  try {
    const query = gql`
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
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// Get trades by user
app.get('/api/trades/user/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const query = gql`
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
  } catch (error) {
    console.error('Error fetching user trades:', error);
    res.status(500).json({ error: 'Failed to fetch user trades' });
  }
});

// Get trade by ID
app.get('/api/trades/:tradeId', async (req: Request, res: Response) => {
  try {
    const { tradeId } = req.params;
    const query = gql`
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
  } catch (error) {
    console.error('Error fetching trade:', error);
    res.status(500).json({ error: 'Failed to fetch trade' });
  }
});

// ==================== USERS ====================

// Get user profile
app.get('/api/users/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const query = gql`
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
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get user statistics
app.get('/api/users/:address/stats', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const query = gql`
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
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// ==================== REVIEWS ====================

// Get reviews for a user
app.get('/api/reviews/user/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const query = gql`
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
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// ==================== ANALYTICS ====================

// Get platform statistics
app.get('/api/analytics/platform', async (req: Request, res: Response) => {
  try {
    const query = gql`
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
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ==================== TRADE RECEIPTS ====================

// Get trade receipt as PDF
app.get('/api/trades/:tradeId/receipt', async (req: Request, res: Response) => {
  try {
    const { tradeId } = req.params;
    const { format } = req.query;

    // Fetch trade data from Subgraph
    const tradeQuery = gql`
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

    const tradeData = await graphqlClient.request<{ trade: any }>(tradeQuery);
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
    } else {
      // Default to PDF
      const pdfStream = generateTradeReceipt(receiptData);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="trusttrade-receipt-${tradeId}.pdf"`);
      pdfStream.pipe(res);
    }
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({ error: 'Failed to generate receipt' });
  }
});

// ==================== NOTIFICATIONS ====================

// Save notification preferences
app.post('/api/notifications/preferences', async (req: Request, res: Response) => {
  try {
    const { address, preferences } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const prefsRef = doc(db, 'notificationPreferences', address.toLowerCase());
    await setDoc(
      prefsRef,
      {
        ...preferences,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    res.json({ success: true, message: 'Preferences saved' });
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// Get notification preferences
app.get('/api/notifications/preferences/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const prefsRef = doc(db, 'notificationPreferences', address.toLowerCase());
    const prefsSnap = await getDoc(prefsRef);

    if (prefsSnap.exists()) {
      res.json(prefsSnap.data());
    } else {
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
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Get user notifications
app.get('/api/notifications/user/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { limit = 50 } = req.query;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('recipient', '==', address.toLowerCase())
    );

    const snapshot = await getDocs(q);
    const notifications = snapshot.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() } as any))
      .sort((a: any, b: any) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime())
      .slice(0, parseInt(limit as string));

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Create a notification (internal use)
app.post('/api/notifications', async (req: Request, res: Response) => {
  try {
    const { recipient, type, title, message, tradeId, link } = req.body;

    if (!recipient || !type) {
      return res.status(400).json({ error: 'Recipient and type are required' });
    }

    const notificationsRef = collection(db, 'notifications');
    const docRef = await addDoc(notificationsRef, {
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
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Mark notification as read
app.patch('/api/notifications/:notificationId/read', async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TrustTrade API Server running on port ${PORT}`);
  console.log(`📊 Subgraph: ${process.env.SUBGRAPH_URL}`);
});

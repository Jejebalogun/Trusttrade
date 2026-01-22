'use client';

import { motion } from 'framer-motion';
import { useReadContract, useReadContracts, useAccount } from 'wagmi';
import { formatEther } from 'viem';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  User,
  Coins,
  ShoppingCart,
  Store,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  BarChart3
} from 'lucide-react';
import { TRUSTTRADE_ABI, TRUSTTRADE_ADDRESS } from '@/lib/contract';
import { useState, useEffect, useMemo } from 'react';

// Trade status enum matching the contract
enum TradeStatus {
  Active = 0,
  Executed = 1,
  Cancelled = 2,
}

interface Trade {
  id: bigint;
  seller: `0x${string}`;
  buyer: `0x${string}`;
  token: `0x${string}`;
  tokenAmount: bigint;
  ethPrice: bigint;
  feeBasisPoints: bigint;
  status: number;
  createdAt: bigint;
}

interface ProcessedTrade {
  id: string;
  seller: string;
  sellerFull: `0x${string}`;
  buyer: string;
  buyerFull: `0x${string}`;
  tokenAmount: string;
  ethPrice: string;
  feeBasisPoints: number;
  status: TradeStatus;
  statusLabel: string;
  token: string;
  tokenAddress: `0x${string}`;
  createdAt: number;
}

interface Stats {
  totalSales: number;
  totalPurchases: number;
  totalVolumeAsSeller: bigint;
  totalVolumeAsBuyer: bigint;
  activeTrades: number;
  completedTrades: number;
  cancelledTrades: number;
}

export function Dashboard() {
  const { address: userAddress, isConnected } = useAccount();
  const [myTradesAsSeller, setMyTradesAsSeller] = useState<ProcessedTrade[]>([]);
  const [myTradesAsBuyer, setMyTradesAsBuyer] = useState<ProcessedTrade[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    totalPurchases: 0,
    totalVolumeAsSeller: 0n,
    totalVolumeAsBuyer: 0n,
    activeTrades: 0,
    completedTrades: 0,
    cancelledTrades: 0,
  });
  const [activeTab, setActiveTab] = useState<'seller' | 'buyer'>('seller');

  // Read trade counter from contract
  const { data: tradeCounter, isLoading: isLoadingCounter } = useReadContract({
    address: TRUSTTRADE_ADDRESS,
    abi: TRUSTTRADE_ABI,
    functionName: 'tradeCounter',
  });

  // Generate contract calls for all trades
  const tradeIds = useMemo(() => {
    if (!tradeCounter || tradeCounter === 0n) return [];
    return Array.from({ length: Number(tradeCounter) }, (_, i) => BigInt(i));
  }, [tradeCounter]);

  // Batch read all trades
  const { data: tradesData, isLoading: isLoadingTrades } = useReadContracts({
    contracts: tradeIds.map((id) => ({
      address: TRUSTTRADE_ADDRESS,
      abi: TRUSTTRADE_ABI,
      functionName: 'getTrade',
      args: [id],
    })),
  });

  // Process trades data
  useEffect(() => {
    if (!tradesData || !userAddress) {
      setMyTradesAsSeller([]);
      setMyTradesAsBuyer([]);
      return;
    }

    const sellerTrades: ProcessedTrade[] = [];
    const buyerTrades: ProcessedTrade[] = [];
    let totalVolumeAsSeller = 0n;
    let totalVolumeAsBuyer = 0n;
    let activeTrades = 0;
    let completedTrades = 0;
    let cancelledTrades = 0;

    tradesData.forEach((result) => {
      if (result.status === 'success' && result.result) {
        const trade = result.result as unknown as Trade;
        const isSeller = trade.seller.toLowerCase() === userAddress.toLowerCase();
        const isBuyer = trade.buyer.toLowerCase() === userAddress.toLowerCase();

        const getStatusLabel = (status: number) => {
          switch (status) {
            case TradeStatus.Active: return 'Active';
            case TradeStatus.Executed: return 'Completed';
            case TradeStatus.Cancelled: return 'Cancelled';
            default: return 'Unknown';
          }
        };

        const processedTrade: ProcessedTrade = {
          id: trade.id.toString(),
          seller: `${trade.seller.slice(0, 6)}...${trade.seller.slice(-4)}`,
          sellerFull: trade.seller,
          buyer: trade.buyer === '0x0000000000000000000000000000000000000000'
            ? 'No buyer yet'
            : `${trade.buyer.slice(0, 6)}...${trade.buyer.slice(-4)}`,
          buyerFull: trade.buyer,
          tokenAmount: formatEther(trade.tokenAmount),
          ethPrice: formatEther(trade.ethPrice),
          feeBasisPoints: Number(trade.feeBasisPoints),
          status: trade.status,
          statusLabel: getStatusLabel(trade.status),
          token: `${trade.token.slice(0, 6)}...${trade.token.slice(-4)}`,
          tokenAddress: trade.token,
          createdAt: Number(trade.createdAt),
        };

        if (isSeller) {
          sellerTrades.push(processedTrade);
          if (trade.status === TradeStatus.Executed) {
            totalVolumeAsSeller += trade.ethPrice;
            completedTrades++;
          } else if (trade.status === TradeStatus.Active) {
            activeTrades++;
          } else if (trade.status === TradeStatus.Cancelled) {
            cancelledTrades++;
          }
        }

        if (isBuyer && trade.status === TradeStatus.Executed) {
          buyerTrades.push(processedTrade);
          totalVolumeAsBuyer += trade.ethPrice;
        }
      }
    });

    // Sort by createdAt descending (newest first)
    sellerTrades.sort((a, b) => b.createdAt - a.createdAt);
    buyerTrades.sort((a, b) => b.createdAt - a.createdAt);

    setMyTradesAsSeller(sellerTrades);
    setMyTradesAsBuyer(buyerTrades);
    setStats({
      totalSales: sellerTrades.filter(t => t.status === TradeStatus.Executed).length,
      totalPurchases: buyerTrades.length,
      totalVolumeAsSeller,
      totalVolumeAsBuyer,
      activeTrades,
      completedTrades,
      cancelledTrades,
    });
  }, [tradesData, userAddress]);

  const formatTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getStatusColor = (status: TradeStatus) => {
    switch (status) {
      case TradeStatus.Active: return 'bg-blue-500/20 text-blue-400';
      case TradeStatus.Executed: return 'bg-green-500/20 text-green-400';
      case TradeStatus.Cancelled: return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusIcon = (status: TradeStatus) => {
    switch (status) {
      case TradeStatus.Active: return <Clock className="w-3 h-3" />;
      case TradeStatus.Executed: return <CheckCircle className="w-3 h-3" />;
      case TradeStatus.Cancelled: return <XCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const isLoading = isLoadingCounter || isLoadingTrades;

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-12 text-center"
      >
        <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">Connect Your Wallet</h3>
        <p className="text-gray-400">
          Connect your wallet to view your trading dashboard and history.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-teal-500/20 rounded-lg">
              <Store className="w-5 h-5 text-teal-400" />
            </div>
            <span className="text-sm text-gray-400">Active Listings</span>
          </div>
          <p className="text-3xl font-bold">{stats.activeTrades}</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-gray-400">Completed</span>
          </div>
          <p className="text-3xl font-bold">{stats.completedTrades + stats.totalPurchases}</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <ArrowUpRight className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-gray-400">Volume Sold</span>
          </div>
          <p className="text-2xl font-bold">{parseFloat(formatEther(stats.totalVolumeAsSeller)).toFixed(4)} ETH</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <ArrowDownLeft className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm text-gray-400">Volume Bought</span>
          </div>
          <p className="text-2xl font-bold">{parseFloat(formatEther(stats.totalVolumeAsBuyer)).toFixed(4)} ETH</p>
        </div>
      </motion.div>

      {/* Trade History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">My Trades</h3>
          <div className="flex items-center gap-2 p-1 bg-gray-800/50 rounded-lg">
            <button
              onClick={() => setActiveTab('seller')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'seller'
                  ? 'bg-teal-500/20 text-teal-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                As Seller ({myTradesAsSeller.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('buyer')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'buyer'
                  ? 'bg-teal-500/20 text-teal-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                As Buyer ({myTradesAsBuyer.length})
              </div>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400">Loading your trades...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'seller' ? (
              myTradesAsSeller.length === 0 ? (
                <div className="text-center py-12">
                  <Store className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">You haven&apos;t created any trades yet</p>
                  <p className="text-sm text-gray-500 mt-1">Create a trade to start selling tokens!</p>
                </div>
              ) : (
                myTradesAsSeller.map((trade, index) => (
                  <motion.div
                    key={trade.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-gray-800/30 rounded-lg border border-white/5 hover:border-teal-500/30 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center">
                          <ArrowUpRight className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Trade #{trade.id}</span>
                            <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${getStatusColor(trade.status)}`}>
                              {getStatusIcon(trade.status)}
                              {trade.statusLabel}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            {trade.status === TradeStatus.Executed
                              ? `Sold to ${trade.buyer}`
                              : trade.status === TradeStatus.Cancelled
                              ? 'Trade cancelled'
                              : 'Waiting for buyer'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Amount</p>
                          <p className="font-semibold">{parseFloat(trade.tokenAmount).toLocaleString()}</p>
                          <p className="text-xs text-gray-500 font-mono">{trade.token}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Price</p>
                          <p className="font-semibold text-teal-400">{trade.ethPrice} ETH</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Fee</p>
                          <p className="font-semibold">{trade.feeBasisPoints / 100}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {formatTimeAgo(trade.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )
            ) : (
              myTradesAsBuyer.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">You haven&apos;t bought any trades yet</p>
                  <p className="text-sm text-gray-500 mt-1">Browse active trades to start buying!</p>
                </div>
              ) : (
                myTradesAsBuyer.map((trade, index) => (
                  <motion.div
                    key={trade.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-gray-800/30 rounded-lg border border-white/5 hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <ArrowDownLeft className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Trade #{trade.id}</span>
                            <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${getStatusColor(trade.status)}`}>
                              {getStatusIcon(trade.status)}
                              {trade.statusLabel}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            Bought from {trade.seller}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Received</p>
                          <p className="font-semibold">{parseFloat(trade.tokenAmount).toLocaleString()}</p>
                          <p className="text-xs text-gray-500 font-mono">{trade.token}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Paid</p>
                          <p className="font-semibold text-purple-400">{trade.ethPrice} ETH</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Fee</p>
                          <p className="font-semibold">{trade.feeBasisPoints / 100}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {formatTimeAgo(trade.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

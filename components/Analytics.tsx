'use client';

import { motion } from 'framer-motion';
import { formatEther } from 'viem';
import { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, TrendingDown, Users } from 'lucide-react';

interface AnalyticsData {
  metrics: {
    totalVolume: string;
    totalTrades: number;
    avgTradeValue: string;
    successRate: number;
    activeTrades: number;
    escrowTrades: number;
  };
  topTokens: { name: string; trades: number; volume: number }[];
  statusBreakdown: { status: string; count: number }[];
}

const CHART_COLORS = ['#14b8a6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    metrics: {
      totalVolume: '0',
      totalTrades: 0,
      avgTradeValue: '0',
      successRate: 0,
      activeTrades: 0,
      escrowTrades: 0,
    },
    topTokens: [],
    statusBreakdown: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Simplified analytics - calculate from sample data
  // In production, this would read from contract using useReadContracts

  // Process trades and generate analytics
  useEffect(() => {
    // Mock data for demonstration - in production integrate with contract reads
    const mockTrades = [
      { status: 2, ethPrice: BigInt('1000000000000000000'), token: '0x1234567890123456789012345678901234567890' },
      { status: 2, ethPrice: BigInt('500000000000000000'), token: '0x0987654321098765432109876543210987654321' },
      { status: 0, ethPrice: BigInt('1500000000000000000'), token: '0x1234567890123456789012345678901234567890' },
      { status: 1, ethPrice: BigInt('750000000000000000'), token: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' },
    ];

    const tokenMap = new Map<string, { trades: number; volume: bigint }>();
    const statusMap = new Map<string, number>();
    statusMap.set('Active', 0);
    statusMap.set('Escrow', 0);
    statusMap.set('Completed', 0);
    statusMap.set('Cancelled', 0);
    statusMap.set('Disputed', 0);

    let totalVolume = 0n;
    let completedTrades = 0;
    let activeTrades = 0;
    let escrowTrades = 0;
    let totalTrades = 0;

    // Process each trade
    mockTrades.forEach((trade) => {
      const statusLabels = ['Active', 'Escrow', 'Completed', 'Cancelled', 'Disputed'];
      const status = statusLabels[trade.status] || 'Unknown';

      totalTrades++;
      statusMap.set(status, (statusMap.get(status) || 0) + 1);

      if (trade.status === 0) activeTrades++;
      if (trade.status === 1) escrowTrades++;
      if (trade.status === 2) {
        completedTrades++;
        totalVolume += trade.ethPrice;
      }

      // Track token usage
      const tokenAddr = trade.token.toLowerCase();
      const existing = tokenMap.get(tokenAddr) || { trades: 0, volume: 0n };
      tokenMap.set(tokenAddr, {
        trades: existing.trades + 1,
        volume: existing.volume + trade.ethPrice,
      });
    });

    const topTokens = Array.from(tokenMap.entries())
      .map(([token, data]) => ({
        name: `${token.slice(0, 6)}...${token.slice(-4)}`,
        trades: data.trades,
        volume: parseFloat(formatEther(data.volume)),
      }))
      .sort((a, b) => b.trades - a.trades)
      .slice(0, 5);

    const avgTradeValue =
      completedTrades > 0 ? formatEther(totalVolume / BigInt(completedTrades)) : '0';

    const statusBreakdown = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    setAnalyticsData({
      metrics: {
        totalVolume: formatEther(totalVolume),
        totalTrades,
        avgTradeValue,
        successRate: totalTrades > 0 ? Math.round((completedTrades / totalTrades) * 100) : 0,
        activeTrades,
        escrowTrades,
      },
      topTokens,
      statusBreakdown,
    });

    setIsLoading(false);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Volume */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Total Volume</h3>
            <TrendingUp className="w-5 h-5 text-teal-400" />
          </div>
          <p className="text-3xl font-bold text-teal-400">
            {parseFloat(analyticsData.metrics.totalVolume).toFixed(2)} ETH
          </p>
          <p className="text-xs text-gray-500 mt-2">All-time trading volume</p>
        </motion.div>

        {/* Total Trades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Total Trades</h3>
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-blue-400">{analyticsData.metrics.totalTrades}</p>
          <p className="text-xs text-gray-500 mt-2">Total trades executed</p>
        </motion.div>

        {/* Avg Trade Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Avg Trade Value</h3>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-purple-400">
            {parseFloat(analyticsData.metrics.avgTradeValue).toFixed(3)} ETH
          </p>
          <p className="text-xs text-gray-500 mt-2">Average trade size</p>
        </motion.div>

        {/* Success Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Success Rate</h3>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-green-400">{analyticsData.metrics.successRate}%</p>
          <p className="text-xs text-gray-500 mt-2">Completed trades ratio</p>
        </motion.div>

        {/* Active Trades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Active Trades</h3>
            <Users className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-3xl font-bold text-orange-400">{analyticsData.metrics.activeTrades}</p>
          <p className="text-xs text-gray-500 mt-2">Currently open</p>
        </motion.div>

        {/* In Escrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">In Escrow</h3>
            <TrendingDown className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-bold text-indigo-400">{analyticsData.metrics.escrowTrades}</p>
          <p className="text-xs text-gray-500 mt-2">Funds held in escrow</p>
        </motion.div>
      </div>

      {/* Trade Status Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-400" />
          Trade Status Distribution
        </h3>
        <div className="space-y-4">
          {analyticsData.statusBreakdown.map((item, index) => (
            <div key={item.status} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">{item.status}</span>
                <span className="text-sm font-bold text-teal-400">{item.count}</span>
              </div>
              <div className="w-full bg-gray-700/30 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full"
                  style={{
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${analyticsData.metrics.totalTrades > 0 ? (item.count / analyticsData.metrics.totalTrades) * 100 : 0}%`,
                  }}
                  transition={{ duration: 1, ease: 'easeInOut' }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Top Tokens */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-bold mb-6">Top Traded Tokens</h3>
        <div className="space-y-4">
          {analyticsData.topTokens.length > 0 ? (
            analyticsData.topTokens.map((token, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-mono text-sm font-semibold">{token.name}</p>
                    <p className="text-xs text-gray-400">{token.trades} trades</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-teal-400">{token.volume.toFixed(2)} ETH</p>
                  <p className="text-xs text-gray-400">Volume</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 py-8">No trading data yet</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

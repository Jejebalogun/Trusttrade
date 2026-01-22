'use client';

import { motion } from 'framer-motion';
import { useReadContract, useReadContracts } from 'wagmi';
import { formatEther } from 'viem';
import { TrendingUp, Users, Coins, Activity, BarChart3 } from 'lucide-react';
import { TRUSTTRADE_ABI, TRUSTTRADE_ADDRESS } from '@/lib/contract';
import { useMemo, useState, useEffect } from 'react';

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

interface StatsData {
  totalTrades: number;
  activeTrades: number;
  completedTrades: number;
  totalVolume: string;
  uniqueSellers: number;
  uniqueBuyers: number;
  avgTradeSize: string;
  successRate: number;
}

export function TradeStats() {
  const [stats, setStats] = useState<StatsData>({
    totalTrades: 0,
    activeTrades: 0,
    completedTrades: 0,
    totalVolume: '0',
    uniqueSellers: 0,
    uniqueBuyers: 0,
    avgTradeSize: '0',
    successRate: 0,
  });

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

  // Calculate stats from trades data
  useEffect(() => {
    if (!tradesData) return;

    let activeTrades = 0;
    let completedTrades = 0;
    let totalVolume = 0n;
    const sellers = new Set<string>();
    const buyers = new Set<string>();

    tradesData.forEach((result) => {
      if (result.status === 'success' && result.result) {
        const trade = result.result as unknown as Trade;

        if (trade.status === TradeStatus.Active) {
          activeTrades++;
        } else if (trade.status === TradeStatus.Executed) {
          completedTrades++;
          totalVolume += trade.ethPrice;
          if (trade.buyer !== '0x0000000000000000000000000000000000000000') {
            buyers.add(trade.buyer);
          }
        }

        sellers.add(trade.seller);
      }
    });

    const totalNonCancelled = activeTrades + completedTrades;
    const avgSize = totalNonCancelled > 0 ? totalVolume / BigInt(totalNonCancelled) : 0n;
    const successRate = totalNonCancelled > 0 ? (completedTrades / totalNonCancelled) * 100 : 0;

    setStats({
      totalTrades: tradesData.length,
      activeTrades,
      completedTrades,
      totalVolume: parseFloat(formatEther(totalVolume)).toFixed(4),
      uniqueSellers: sellers.size,
      uniqueBuyers: buyers.size,
      avgTradeSize: parseFloat(formatEther(avgSize)).toFixed(4),
      successRate: Math.round(successRate),
    });
  }, [tradesData]);

  const isLoading = isLoadingCounter || isLoadingTrades;

  const statCards = [
    {
      label: 'Total Volume',
      value: `${stats.totalVolume} ETH`,
      icon: TrendingUp,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/20',
    },
    {
      label: 'Active Trades',
      value: stats.activeTrades.toString(),
      icon: Activity,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      label: 'Completed',
      value: stats.completedTrades.toString(),
      icon: Coins,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      label: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: BarChart3,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-teal-400" />
        <h3 className="text-lg font-semibold">Platform Statistics</h3>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="p-4 glass-card"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <span className="text-xs text-gray-400">{stat.label}</span>
            </div>
            {isLoading ? (
              <div className="h-7 w-20 bg-gray-700/50 rounded animate-pulse" />
            ) : (
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-4 bg-gray-800/30 rounded-lg border border-white/5 text-center"
        >
          <Users className="w-5 h-5 text-gray-400 mx-auto mb-2" />
          {isLoading ? (
            <div className="h-5 w-8 bg-gray-700/50 rounded animate-pulse mx-auto mb-1" />
          ) : (
            <p className="text-lg font-semibold">{stats.uniqueSellers}</p>
          )}
          <p className="text-xs text-gray-400">Unique Sellers</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="p-4 bg-gray-800/30 rounded-lg border border-white/5 text-center"
        >
          <Users className="w-5 h-5 text-gray-400 mx-auto mb-2" />
          {isLoading ? (
            <div className="h-5 w-8 bg-gray-700/50 rounded animate-pulse mx-auto mb-1" />
          ) : (
            <p className="text-lg font-semibold">{stats.uniqueBuyers}</p>
          )}
          <p className="text-xs text-gray-400">Unique Buyers</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="p-4 bg-gray-800/30 rounded-lg border border-white/5 text-center"
        >
          <Coins className="w-5 h-5 text-gray-400 mx-auto mb-2" />
          {isLoading ? (
            <div className="h-5 w-16 bg-gray-700/50 rounded animate-pulse mx-auto mb-1" />
          ) : (
            <p className="text-lg font-semibold">{stats.avgTradeSize} ETH</p>
          )}
          <p className="text-xs text-gray-400">Avg Trade Size</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

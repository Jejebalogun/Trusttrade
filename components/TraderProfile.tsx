'use client';

import { motion } from 'framer-motion';
import { useReadContracts, useAccount } from 'wagmi';
import { formatEther } from 'viem';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Award,
  BarChart3,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { TRUSTTRADE_ABI, TRUSTTRADE_ADDRESS } from '@/lib/contract';
import { fetchEthosScore } from '@/lib/ethos';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from './Toast';

interface TraderStats {
  totalTrades: number;
  completedTrades: number;
  cancelledTrades: number;
  successRate: number;
  totalVolume: string;
  avgTradeSize: string;
}

interface TraderProfileProps {
  address: string;
}

export function TraderProfile({ address }: TraderProfileProps) {
  const { addToast } = useToast();
  const [ethosScore, setEthosScore] = useState<number>(0);
  const [stats, setStats] = useState<TraderStats>({
    totalTrades: 0,
    completedTrades: 0,
    cancelledTrades: 0,
    successRate: 0,
    totalVolume: '0',
    avgTradeSize: '0',
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Read trade counter
  const { data: tradeCounterData, isLoading: isLoadingCounter } = useReadContracts({
    contracts: [
      {
        address: TRUSTTRADE_ADDRESS,
        abi: TRUSTTRADE_ABI,
        functionName: 'tradeCounter',
      },
    ],
  });

  const tradeCounter = tradeCounterData?.[0]?.result as bigint | undefined;

  // Batch read all trades
  const { data: tradesData, isLoading: isLoadingTrades } = useReadContracts({
    contracts: useMemo(() => {
      if (!tradeCounter) return [];
      return Array.from({ length: Number(tradeCounter) }, (_, i) => ({
        address: TRUSTTRADE_ADDRESS,
        abi: TRUSTTRADE_ABI,
        functionName: 'getTrade',
        args: [BigInt(i)],
      }));
    }, [tradeCounter]),
  });

  // Fetch Ethos score
  useEffect(() => {
    const loadEthosScore = async () => {
      try {
        const score = await fetchEthosScore(address);
        setEthosScore(score.score);
      } catch (error) {
        console.error('Failed to fetch Ethos score:', error);
      }
    };

    loadEthosScore();
  }, [address]);

  // Process trades and calculate stats
  useEffect(() => {
    if (!tradesData) return;

    let totalTrades = 0;
    let completedTrades = 0;
    let cancelledTrades = 0;
    let totalVolume = 0n;

    tradesData.forEach((result) => {
      if (result.status === 'success' && result.result) {
        const trade = result.result as any;

        // Check if trader is seller or buyer
        const isSeller = trade.seller.toLowerCase() === address.toLowerCase();
        const isBuyer = trade.buyer?.toLowerCase() === address.toLowerCase();

        if (isSeller || isBuyer) {
          totalTrades++;

          if (trade.status === 2) {
            // Completed
            completedTrades++;
            totalVolume += BigInt(trade.ethPrice);
          } else if (trade.status === 3) {
            // Cancelled
            cancelledTrades++;
          }
        }
      }
    });

    const successRate = totalTrades > 0 ? Math.round((completedTrades / totalTrades) * 100) : 0;
    const avgTradeSize = totalTrades > 0 ? formatEther(totalVolume / BigInt(totalTrades)) : '0';

    setStats({
      totalTrades,
      completedTrades,
      cancelledTrades,
      successRate,
      totalVolume: formatEther(totalVolume),
      avgTradeSize,
    });

    setIsLoadingProfile(false);
  }, [tradesData, address]);

  const getTierBadge = (score: number) => {
    if (score >= 2000) return { label: 'VIP Trader', color: 'bg-green-500/20 text-green-400' };
    if (score >= 1000) return { label: 'Verified Trader', color: 'bg-blue-500/20 text-blue-400' };
    return { label: 'New Trader', color: 'bg-orange-500/20 text-orange-400' };
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    addToast({
      type: 'success',
      title: 'Address copied!',
      message: 'Trader address copied to clipboard',
    });
  };

  const isLoading = isLoadingProfile || isLoadingCounter || isLoadingTrades;
  const tier = getTierBadge(ethosScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Profile Header */}
      <div className="glass-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Trader Profile</h1>

            {/* Address */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <code className="text-xs sm:text-sm font-mono bg-gray-900/50 px-2 sm:px-3 py-1.5 rounded truncate">
                {address}
              </code>
              <button
                onClick={copyAddress}
                className="p-2 hover:bg-gray-700/50 rounded transition-colors"
              >
                <Copy className="w-4 h-4 text-gray-400" />
              </button>
              <a
                href={`https://basescan.org/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-700/50 rounded transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-teal-400" />
              </a>
            </div>

            {/* Tier Badge */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold ${tier.color}`}>
                {tier.label}
              </span>
              <div className="text-sm">
                <p className="text-gray-400">Ethos Score:</p>
                <p className="text-lg sm:text-xl font-bold text-teal-400">{ethosScore.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Trades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 sm:p-6 text-center"
        >
          <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-teal-400 mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-gray-400 mb-1">Total Trades</p>
          <p className="text-2xl sm:text-3xl font-bold">{stats.totalTrades}</p>
        </motion.div>

        {/* Success Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4 sm:p-6 text-center"
        >
          <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-gray-400 mb-1">Success Rate</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-400">{stats.successRate}%</p>
        </motion.div>

        {/* Completed Trades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4 sm:p-6 text-center"
        >
          <Award className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-gray-400 mb-1">Completed</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-400">{stats.completedTrades}</p>
        </motion.div>

        {/* Cancelled Trades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-4 sm:p-6 text-center"
        >
          <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400 mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-gray-400 mb-1">Cancelled</p>
          <p className="text-2xl sm:text-3xl font-bold text-orange-400">{stats.cancelledTrades}</p>
        </motion.div>

        {/* Total Volume */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-4 sm:p-6 text-center"
        >
          <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-gray-400 mb-1">Total Volume</p>
          <p className="text-lg sm:text-2xl font-bold text-purple-400">{parseFloat(stats.totalVolume).toFixed(2)} ETH</p>
        </motion.div>

        {/* Avg Trade Size */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-4 sm:p-6 text-center"
        >
          <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-gray-400 mb-1">Avg Trade Size</p>
          <p className="text-lg sm:text-2xl font-bold text-cyan-400">{parseFloat(stats.avgTradeSize).toFixed(3)} ETH</p>
        </motion.div>
      </div>

      {/* Trust Score Breakdown */}
      <div className="glass-card p-6 sm:p-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-teal-400" />
          Trust Metrics
        </h2>

        <div className="space-y-4">
          {/* Trust Score */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Ethos Trust Score</span>
              <span className="text-lg font-bold text-teal-400">{ethosScore}</span>
            </div>
            <div className="w-full bg-gray-800/50 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-teal-500 to-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((ethosScore / 3000) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Success Rate Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Trade Success Rate</span>
              <span className="text-lg font-bold text-green-400">{stats.successRate}%</span>
            </div>
            <div className="w-full bg-gray-800/50 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${stats.successRate}%` }}
              />
            </div>
          </div>

          {/* Completion vs Cancellation */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Completion Rate</span>
              <span className="text-sm text-gray-300">
                {stats.completedTrades} completed, {stats.cancelledTrades} cancelled
              </span>
            </div>
            <div className="flex gap-2 h-2 rounded-full overflow-hidden bg-gray-800/50">
              <div
                className="bg-blue-500 transition-all"
                style={{
                  width: `${
                    stats.totalTrades > 0
                      ? ((stats.completedTrades / stats.totalTrades) * 100).toFixed(1)
                      : 0
                  }%`,
                }}
              />
              <div
                className="bg-orange-500 transition-all"
                style={{
                  width: `${
                    stats.totalTrades > 0
                      ? ((stats.cancelledTrades / stats.totalTrades) * 100).toFixed(1)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="glass-card p-6 sm:p-8">
        <h2 className="text-xl font-bold mb-4">Trader Status</h2>
        <div className="space-y-3 text-sm text-gray-300">
          {ethosScore >= 2000 && (
            <p className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              ✓ VIP tier - Enjoy 0% trading fees
            </p>
          )}
          {ethosScore >= 1000 && ethosScore < 2000 && (
            <p className="flex items-center gap-2 text-blue-400">
              <CheckCircle className="w-4 h-4" />
              ✓ Verified trader - Pay reduced 1% fees
            </p>
          )}
          {stats.successRate >= 95 && (
            <p className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              ✓ Excellent track record with {stats.successRate}% success rate
            </p>
          )}
          {stats.totalTrades === 0 && (
            <p className="flex items-center gap-2 text-orange-400">
              ⚠ No trades yet - Start trading to build reputation
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

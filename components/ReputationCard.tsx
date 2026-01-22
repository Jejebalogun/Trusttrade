'use client';

import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useReputationFee } from '@/hooks/useReputationFee';
import { Award, TrendingUp, AlertCircle } from 'lucide-react';
import { getFeeColor } from '@/lib/ethos';

export function ReputationCard() {
  const { address, isConnected } = useAccount();
  const { score, tier, feePercent, isLoading, ethosData } = useReputationFee(address);

  if (!isConnected) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-gray-400">
          Connect your wallet to view your Ethos reputation score and start trading
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="glass-card p-8">
        <div className="flex items-center justify-center">
          <div className="spinner mr-3" />
          <span className="text-gray-400">Loading reputation data...</span>
        </div>
      </div>
    );
  }

  const feeColor = getFeeColor(score);
  const colorMap = {
    neonGreen: 'text-green-400',
    blue: 'text-blue-400',
    warningOrange: 'text-orange-400',
  };

  const bgColorMap = {
    neonGreen: 'bg-green-500/20',
    blue: 'bg-blue-500/20',
    warningOrange: 'bg-orange-500/20',
  };

  const glowMap = {
    neonGreen: 'glow-green',
    blue: '',
    warningOrange: 'glow-orange',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`glass-card p-8 hover-lift ${glowMap[feeColor as keyof typeof glowMap]}`}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold mb-1">Your Reputation</h3>
          <p className="text-sm text-gray-400">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>
        <div className={`w-12 h-12 ${bgColorMap[feeColor as keyof typeof bgColorMap]} rounded-full flex items-center justify-center`}>
          <Award className={`w-6 h-6 ${colorMap[feeColor as keyof typeof colorMap]}`} />
        </div>
      </div>

      {/* Score display */}
      <div className="mb-6">
        <div className="flex items-baseline gap-3 mb-2">
          <motion.span
            key={score}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-5xl font-bold ${colorMap[feeColor as keyof typeof colorMap]}`}
          >
            {score.toLocaleString()}
          </motion.span>
          <span className="text-gray-400">Ethos Score</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((score / 2000) * 100, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full ${
              score >= 2000
                ? 'bg-green-400'
                : score >= 1000
                ? 'bg-blue-400'
                : 'bg-orange-400'
            }`}
          />
        </div>
      </div>

      {/* Tier badge */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-400 mb-1">Fee Tier</p>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold ${colorMap[feeColor as keyof typeof colorMap]}`}>
              {tier}
            </span>
            {tier === 'VIP' && <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">TRUSTLESS</span>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400 mb-1">Trading Fee</p>
          <p className={`text-3xl font-bold ${colorMap[feeColor as keyof typeof colorMap]}`}>
            {feePercent}%
          </p>
        </div>
      </div>

      {/* Trust level */}
      {ethosData && (
        <div className="pt-6 border-t border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-gray-400">Trust Level:</span>
            <span className="text-sm font-semibold capitalize">{ethosData.level}</span>
          </div>

          {score < 1000 && (
            <div className="flex items-start gap-2 mt-4 p-3 bg-orange-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="font-semibold text-orange-400 mb-1">Build Your Reputation</p>
                <p>Increase your Ethos score to unlock lower fees and better trading benefits.</p>
              </div>
            </div>
          )}

          {score >= 2000 && (
            <div className="flex items-start gap-2 mt-4 p-3 bg-green-500/10 rounded-lg">
              <Award className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="font-semibold text-green-400 mb-1">VIP Status Unlocked!</p>
                <p>You trade with 0% fees. Your reputation speaks for itself.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

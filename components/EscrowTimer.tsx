'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface EscrowTimerProps {
  executedAt: number;
  escrowDuration: number;
  tradeId: number;
  onReleaseReady?: () => void;
}

export function EscrowTimer({
  executedAt,
  escrowDuration,
  tradeId,
  onReleaseReady,
}: EscrowTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  } | null>(null);

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const expiryTime = executedAt + escrowDuration;
      const diff = expiryTime - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
        });
        onReleaseReady?.();
      } else {
        setIsExpired(false);
        const days = Math.floor(diff / (24 * 60 * 60));
        const hours = Math.floor((diff % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((diff % (60 * 60)) / 60);
        const seconds = diff % 60;

        setTimeRemaining({
          days,
          hours,
          minutes,
          seconds,
          total: diff,
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [executedAt, escrowDuration, onReleaseReady]);

  if (!timeRemaining) {
    return <div className="h-12" />;
  }

  const progressPercent = Math.min(
    100,
    ((escrowDuration - timeRemaining.total) / escrowDuration) * 100
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isExpired ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : (
            <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
          )}
          <span className="text-sm font-medium">
            {isExpired ? 'Ready to Release' : 'In Escrow'}
          </span>
        </div>
        <span className="text-xs text-gray-400">Trade #{tradeId}</span>
      </div>

      {/* Countdown Timer */}
      {!isExpired && (
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-400">{timeRemaining.days}</p>
            <p className="text-xs text-gray-400">Days</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-400">{timeRemaining.hours}</p>
            <p className="text-xs text-gray-400">Hours</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-400">{timeRemaining.minutes}</p>
            <p className="text-xs text-gray-400">Mins</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-400">{timeRemaining.seconds}</p>
            <p className="text-xs text-gray-400">Secs</p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full bg-gray-700/30 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
      </div>

      {/* Status Message */}
      {isExpired ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 text-green-400 text-sm"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Escrow period expired. Ready to release funds to seller.</span>
        </motion.div>
      ) : timeRemaining.total < 3600 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 text-orange-400 text-sm"
        >
          <AlertCircle className="w-4 h-4" />
          <span>Escrow expiring soon. Dispute if needed.</span>
        </motion.div>
      ) : (
        <p className="text-xs text-gray-400 text-center">
          Funds held in escrow until timer expires. Either party can dispute within this period.
        </p>
      )}
    </motion.div>
  );
}

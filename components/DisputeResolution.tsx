'use client';

import { useState } from 'react';
import { AlertTriangle, MessageSquare, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DisputedTrade {
  id: number;
  seller: string;
  buyer: string;
  token: string;
  tokenAmount: number;
  ethPrice: number;
  disputedBy: string;
  reason: string;
  disputedAt: number;
  resolved: boolean;
  resolution?: 'buyer-favored' | 'seller-favored';
  resolutionReason?: string;
}

interface DisputeResolutionProps {
  trade: DisputedTrade;
  userAddress?: string;
  isFeeCollector?: boolean;
  onResolve?: (tradeId: number, favorsBuyer: boolean, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export default function DisputeResolution({
  trade,
  userAddress,
  isFeeCollector = false,
  onResolve,
  isLoading = false,
}: DisputeResolutionProps) {
  const [selectedResolution, setSelectedResolution] = useState<'buyer' | 'seller' | null>(null);
  const [resolutionReason, setResolutionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isBuyer = userAddress?.toLowerCase() === trade.buyer.toLowerCase();
  const isSeller = userAddress?.toLowerCase() === trade.seller.toLowerCase();
  const canResolve = isFeeCollector && !trade.resolved;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleResolve = async () => {
    if (!selectedResolution || !onResolve) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const favorsBuyer = selectedResolution === 'buyer';
      await onResolve(trade.id, favorsBuyer, resolutionReason);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedResolution(null);
        setResolutionReason('');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve dispute');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDisputerRole = () => {
    if (trade.disputedBy.toLowerCase() === trade.buyer.toLowerCase()) {
      return 'Buyer initiated dispute';
    }
    return 'Seller initiated dispute';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative bg-gray-900/95 backdrop-blur-md border border-red-500/30 rounded-xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/20 rounded-lg flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white">Trade Under Dispute</h2>
            <p className="text-sm text-gray-400 mt-1">Trade ID: #{trade.id}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          {trade.resolved ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-teal-400">Dispute Resolved</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {trade.resolution === 'buyer-favored' ? 'Buyer ' : 'Seller '}
                  favored on {formatDate(trade.disputedAt)}
                </p>
              </div>
            </>
          ) : (
            <>
              <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-400">Pending Resolution</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Disputed {formatDate(trade.disputedAt)} by {getDisputerRole()}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Trade Details */}
        <div className="space-y-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
          <h3 className="font-semibold text-white text-sm">Trade Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Token & Amount</p>
              <p className="font-semibold text-white">
                {parseFloat(String(trade.tokenAmount)).toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })}{' '}
                <span className="text-gray-400 ml-1">{trade.token.slice(0, 6)}...</span>
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">ETH Price</p>
              <p className="font-semibold text-white">{trade.ethPrice} ETH</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Seller</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs text-teal-400">{formatAddress(trade.seller)}</p>
                {isSeller && (
                  <span className="text-xs px-2 py-0.5 rounded bg-teal-500/20 text-teal-400">
                    You
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Buyer</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs text-blue-400">{formatAddress(trade.buyer)}</p>
                {isBuyer && (
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                    You
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dispute Reason */}
        <div className="space-y-2 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-1">Dispute Reason</p>
              <p className="text-sm text-gray-300 italic">"{trade.reason}"</p>
            </div>
          </div>
        </div>

        {/* Resolution History (if resolved) */}
        <AnimatePresence>
          {trade.resolved && trade.resolutionReason && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2 p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg"
            >
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-teal-400 mb-1">Resolution Reason</p>
                  <p className="text-sm text-teal-300">{trade.resolutionReason}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resolution Section (only for fee collector if not resolved) */}
        <AnimatePresence>
          {canResolve && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg"
            >
              <h3 className="font-semibold text-white text-sm">Resolve Dispute</h3>

              {/* Resolution Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setSelectedResolution('buyer');
                    setError(null);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedResolution === 'buyer'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-700 bg-gray-800/30 hover:border-blue-500/50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-1 ${
                        selectedResolution === 'buyer'
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-600'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-white">Favor Buyer</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Refund ETH to buyer, return tokens
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setSelectedResolution('seller');
                    setError(null);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedResolution === 'seller'
                      ? 'border-teal-500 bg-teal-500/20'
                      : 'border-gray-700 bg-gray-800/30 hover:border-teal-500/50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-1 ${
                        selectedResolution === 'seller'
                          ? 'border-teal-500 bg-teal-500'
                          : 'border-gray-600'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-white">Favor Seller</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Release ETH to seller, keep tokens with buyer
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Resolution Reason Input */}
              <AnimatePresence>
                {selectedResolution && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <textarea
                      value={resolutionReason}
                      onChange={(e) => {
                        setResolutionReason(e.target.value);
                        setError(null);
                      }}
                      placeholder="Explain the resolution reasoning..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {resolutionReason.length}/500
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded"
                  >
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success Message */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-2 p-3 bg-teal-500/10 border border-teal-500/30 rounded"
                  >
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-teal-300">Dispute resolved successfully!</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <button
                onClick={handleResolve}
                disabled={!selectedResolution || isSubmitting || isLoading}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg text-white font-medium hover:from-blue-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resolving...
                  </>
                ) : (
                  'Resolve Dispute'
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info for participants (if not fee collector) */}
        {!canResolve && (
          <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-400">
              {trade.resolved ? (
                <>
                  ✓ This dispute has been resolved. The resolution has been documented
                  on the blockchain.
                </>
              ) : (
                <>
                  This dispute is pending resolution by the fee collector. Please wait for
                  the resolution to be finalized.
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

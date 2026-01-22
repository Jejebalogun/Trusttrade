'use client';

import { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Trade {
  id: number;
  seller: string;
  buyer: string;
  token: string;
  tokenAmount: number;
  ethPrice: number;
  status: 'Active' | 'Escrow' | 'Completed' | 'Cancelled' | 'Disputed';
  createdAt: number;
  executedAt?: number;
  disputed: boolean;
}

interface TradeHistoryProps {
  trades: Trade[];
  userAddress?: string;
  isLoading?: boolean;
}

type FilterStatus = 'All' | 'Completed' | 'Active' | 'Escrow' | 'Disputed' | 'Cancelled';
type SortBy = 'newest' | 'oldest' | 'value-high' | 'value-low';

export default function TradeHistory({
  trades,
  userAddress,
  isLoading = false,
}: TradeHistoryProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [expandedTradeId, setExpandedTradeId] = useState<number | null>(null);

  // Filter trades based on status and user role
  const filteredTrades = useMemo(() => {
    let filtered = trades;

    if (filterStatus !== 'All') {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }

    // Sort trades
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'value-high':
          return b.ethPrice - a.ethPrice;
        case 'value-low':
          return a.ethPrice - b.ethPrice;
        case 'newest':
        default:
          return b.createdAt - a.createdAt;
      }
    });
  }, [trades, filterStatus, sortBy]);

  const getStatusColor = (status: Trade['status'], disputed: boolean) => {
    if (disputed) return 'bg-red-500/10 border-red-500/30 text-red-400';
    switch (status) {
      case 'Completed':
        return 'bg-teal-500/10 border-teal-500/30 text-teal-400';
      case 'Escrow':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'Active':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'Cancelled':
        return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
      case 'Disputed':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      default:
        return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    }
  };

  const getStatusIcon = (status: Trade['status'], disputed: boolean) => {
    if (disputed) return <AlertCircle className="w-4 h-4" />;
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'Escrow':
        return <Clock className="w-4 h-4" />;
      case 'Active':
        return <Zap className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getUserRole = (trade: Trade) => {
    if (userAddress?.toLowerCase() === trade.seller.toLowerCase()) {
      return 'seller';
    }
    if (userAddress?.toLowerCase() === trade.buyer?.toLowerCase()) {
      return 'buyer';
    }
    return 'observer';
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

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="w-full space-y-4">
      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center flex-wrap">
        <div className="flex flex-wrap gap-2">
          {(['All', 'Completed', 'Active', 'Escrow', 'Disputed', 'Cancelled'] as FilterStatus[]).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                }`}
              >
                {status}
              </button>
            )
          )}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-xs font-medium text-gray-300 hover:border-teal-500/50 transition-colors"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="value-high">Highest Value</option>
          <option value="value-low">Lowest Value</option>
        </select>
      </div>

      {/* Trade List */}
      <div className="space-y-2">
        <AnimatePresence>
          {isLoading ? (
            // Loading skeletons
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : filteredTrades.length === 0 ? (
            // Empty state
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 px-4 rounded-lg bg-gray-900/50 border border-gray-800"
            >
              <Zap className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No trades found</p>
              <p className="text-xs text-gray-500 mt-1">
                {filterStatus !== 'All' ? `Try a different filter` : 'Start trading to build your history'}
              </p>
            </motion.div>
          ) : (
            // Trade rows
            filteredTrades.map((trade, index) => {
              const role = getUserRole(trade);
              const isBuyer = role === 'buyer';
              const isExpanded = expandedTradeId === trade.id;

              return (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <button
                    onClick={() =>
                      setExpandedTradeId(isExpanded ? null : trade.id)
                    }
                    className="w-full text-left"
                  >
                    <div className="p-4 bg-gray-900/40 border border-gray-800 rounded-lg hover:border-teal-500/30 transition-all group-hover:bg-gray-900/60">
                      <div className="flex items-center justify-between gap-4">
                        {/* Left: Trade Direction & Token */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2.5 rounded-lg flex-shrink-0 ${
                              isBuyer
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-teal-500/20 text-teal-400'
                            }`}
                          >
                            {isBuyer ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm text-white">
                                {trade.token.slice(0, 6)}...
                              </p>
                              <span className="text-xs px-2 py-0.5 rounded bg-gray-700/50 text-gray-300">
                                {isBuyer ? 'Bought' : 'Sold'} {parseFloat(String(trade.tokenAmount)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDate(trade.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Middle: ETH Value */}
                        <div className="text-right hidden sm:block">
                          <p className="font-semibold text-sm text-white">
                            {trade.ethPrice} ETH
                          </p>
                        </div>

                        {/* Right: Status Badge */}
                        <div
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border flex-shrink-0 ${getStatusColor(
                            trade.status,
                            trade.disputed
                          )}`}
                        >
                          {getStatusIcon(trade.status, trade.disputed)}
                          <span className="text-xs font-medium">
                            {trade.disputed ? 'Disputed' : trade.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-gray-900/60 border border-gray-800 border-t-0 rounded-b-lg space-y-3 mt-1">
                          {/* Trade Parties */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Seller</p>
                              <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
                                <span className="text-xs font-mono text-gray-300">
                                  {formatAddress(trade.seller)}
                                </span>
                                {role === 'seller' && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 ml-auto">
                                    You
                                  </span>
                                )}
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-gray-400 mb-1">Buyer</p>
                              <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
                                <span className="text-xs font-mono text-gray-300">
                                  {trade.buyer ? formatAddress(trade.buyer) : 'Pending'}
                                </span>
                                {role === 'buyer' && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 ml-auto">
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Trade Details */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Token Amount</p>
                              <p className="font-semibold text-sm text-white">
                                {parseFloat(String(trade.tokenAmount)).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-400 mb-1">ETH Price</p>
                              <p className="font-semibold text-sm text-white">
                                {trade.ethPrice} ETH
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-400 mb-1">Trade ID</p>
                              <p className="font-semibold text-sm font-mono text-teal-400">
                                #{trade.id}
                              </p>
                            </div>
                          </div>

                          {/* Timestamps */}
                          {(trade.executedAt || trade.status !== 'Active') && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-400 mb-1">Created</p>
                                <p className="text-xs text-gray-300">
                                  {formatDate(trade.createdAt)}
                                </p>
                              </div>

                              {trade.executedAt && (
                                <div>
                                  <p className="text-xs text-gray-400 mb-1">Executed</p>
                                  <p className="text-xs text-gray-300">
                                    {formatDate(trade.executedAt)}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Button - Placeholder */}
                          {trade.status === 'Disputed' && role !== 'observer' && (
                            <button className="w-full mt-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-all">
                              View Dispute Details
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Summary Stats */}
      {trades.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-800"
        >
          <div className="p-3 bg-gray-900/40 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Total Trades</p>
            <p className="text-lg font-semibold text-white">{trades.length}</p>
          </div>

          <div className="p-3 bg-gray-900/40 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Completed</p>
            <p className="text-lg font-semibold text-teal-400">
              {trades.filter((t) => t.status === 'Completed').length}
            </p>
          </div>

          <div className="p-3 bg-gray-900/40 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Total Value</p>
            <p className="text-lg font-semibold text-white">
              {trades
                .reduce((acc, t) => acc + t.ethPrice, 0)
                .toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
              ETH
            </p>
          </div>

          <div className="p-3 bg-gray-900/40 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Success Rate</p>
            <p className="text-lg font-semibold text-white">
              {trades.length > 0
                ? Math.round(
                    (trades.filter((t) => t.status === 'Completed').length /
                      trades.length) *
                      100
                  )
                : 0}
              %
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { TrendingUp, Clock, User, Coins, Loader2, AlertCircle, CheckCircle, X, Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { TRUSTTRADE_ABI, TRUSTTRADE_ADDRESS } from '@/lib/contract';
import { useState, useEffect, useMemo } from 'react';
import { fetchEthosScore } from '@/lib/ethos';
import { getTokenDisplayName, getCachedTokenInfo } from '@/lib/tokens';
import { TradeCardSkeleton } from './Skeleton';
import { useToast } from './Toast';
import { EscrowTimer } from './EscrowTimer';
import { UserProfile } from './UserProfile';

// Trade status enum matching the contract
enum TradeStatus {
  Active = 0,
  Escrow = 1,
  Completed = 2,
  Cancelled = 3,
  Disputed = 4,
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
  executedAt: bigint;
  escrowDuration: bigint;
  disputed: boolean;
}

interface DisplayTrade {
  id: string;
  seller: string;
  sellerFull: `0x${string}`;
  sellerScore: number;
  tokenAmount: string;
  ethPrice: string;
  ethPriceRaw: bigint;
  feeBasisPoints: number;
  status: string;
  statusCode: number;
  token: string;
  tokenSymbol: string;
  tokenAddress: `0x${string}`;
  createdAt: number;
  executedAt: number;
  escrowDuration: number;
  disputed: boolean;
}

// Mock trades shown when contract has no trades
const mockTrades: DisplayTrade[] = [
  {
    id: '0',
    seller: '0x742d...5e45',
    sellerFull: '0x742d35Cc6634C0532925a3b844Bc9e7595f5e45' as `0x${string}`,
    sellerScore: 2150,
    tokenAmount: '100',
    ethPrice: '0.05',
    ethPriceRaw: parseEther('0.05'),
    feeBasisPoints: 0,
    status: 'Active',
    statusCode: 0,
    token: 'DAK Token',
    tokenSymbol: 'DAK',
    tokenAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    createdAt: Date.now() / 1000 - 7200,
    executedAt: 0,
    escrowDuration: 86400,
    disputed: false,
  },
];

export function TradeFeed() {
  const { address: userAddress, isConnected } = useAccount();
  const { addToast, updateToast } = useToast();
  const [displayTrades, setDisplayTrades] = useState<DisplayTrade[]>([]);
  const [sellerScores, setSellerScores] = useState<Record<string, number>>({});
  const [tokenSymbols, setTokenSymbols] = useState<Record<string, string>>({});
  const [buyingTradeId, setBuyingTradeId] = useState<string | null>(null);
  const [cancellingTradeId, setCancellingTradeId] = useState<string | null>(null);
  const [releasingTradeId, setReleasingTradeId] = useState<string | null>(null);
  const [disputingTradeId, setDisputingTradeId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);
  const [releaseSuccess, setReleaseSuccess] = useState<string | null>(null);
  const [disputeSuccess, setDisputeSuccess] = useState<string | null>(null);
  const [buyToastId, setBuyToastId] = useState<string | null>(null);
  const [cancelToastId, setCancelToastId] = useState<string | null>(null);
  const [releaseToastId, setReleaseToastId] = useState<string | null>(null);
  const [disputeToastId, setDisputeToastId] = useState<string | null>(null);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [feeTierFilter, setFeeTierFilter] = useState<'all' | 'vip' | 'standard' | 'new'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_low' | 'price_high' | 'trust'>('newest');
  const [showMyTrades, setShowMyTrades] = useState(false);

  // Read trade counter from contract
  const { data: tradeCounter, isLoading: isLoadingCounter, refetch: refetchCounter } = useReadContract({
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
  const { data: tradesData, isLoading: isLoadingTrades, refetch: refetchTrades } = useReadContracts({
    contracts: tradeIds.map((id) => ({
      address: TRUSTTRADE_ADDRESS,
      abi: TRUSTTRADE_ABI,
      functionName: 'getTrade',
      args: [id],
    })),
  });

  // Execute trade (buy) function
  const { data: buyHash, writeContract: executeBuy, isPending: isBuyPending, error: buyError } = useWriteContract();

  // Cancel trade function
  const { data: cancelHash, writeContract: executeCancel, isPending: isCancelPending, error: cancelError } = useWriteContract();

  // Release escrow function
  const { data: releaseHash, writeContract: executeRelease, isPending: isReleasePending, error: releaseError } = useWriteContract();

  // Dispute trade function
  const { data: disputeHash, writeContract: executeDispute, isPending: isDisputePending, error: disputeError } = useWriteContract();

  // Wait for buy transaction receipt
  const { isLoading: isBuyConfirming, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({
    hash: buyHash,
  });

  // Wait for cancel transaction receipt
  const { isLoading: isCancelConfirming, isSuccess: isCancelSuccess } = useWaitForTransactionReceipt({
    hash: cancelHash,
  });

  // Wait for release transaction receipt
  const { isLoading: isReleaseConfirming, isSuccess: isReleaseSuccess } = useWaitForTransactionReceipt({
    hash: releaseHash,
  });

  // Wait for dispute transaction receipt
  const { isLoading: isDisputeConfirming, isSuccess: isDisputeSuccess } = useWaitForTransactionReceipt({
    hash: disputeHash,
  });

  // Handle buy success
  useEffect(() => {
    if (isBuySuccess && buyingTradeId) {
      setTxSuccess(buyingTradeId);
      setBuyingTradeId(null);
      // Update toast to success
      if (buyToastId) {
        updateToast(buyToastId, {
          type: 'success',
          title: 'Purchase successful!',
          message: `Trade #${buyingTradeId} completed successfully`,
        });
        setBuyToastId(null);
      }
      // Refetch trades after successful purchase
      refetchCounter();
      refetchTrades();
      // Clear success message after 5 seconds
      setTimeout(() => setTxSuccess(null), 5000);
    }
  }, [isBuySuccess, buyingTradeId, buyToastId, updateToast, refetchCounter, refetchTrades]);

  // Handle cancel success
  useEffect(() => {
    if (isCancelSuccess && cancellingTradeId) {
      setCancelSuccess(cancellingTradeId);
      setCancellingTradeId(null);
      setShowCancelConfirm(null);
      // Update toast to success
      if (cancelToastId) {
        updateToast(cancelToastId, {
          type: 'success',
          title: 'Trade cancelled',
          message: `Trade #${cancellingTradeId} cancelled. Tokens returned.`,
        });
        setCancelToastId(null);
      }
      // Refetch trades after successful cancellation
      refetchCounter();
      refetchTrades();
      // Clear success message after 5 seconds
      setTimeout(() => setCancelSuccess(null), 5000);
    }
  }, [isCancelSuccess, cancellingTradeId, cancelToastId, updateToast, refetchCounter, refetchTrades]);

  // Handle release escrow success
  useEffect(() => {
    if (isReleaseSuccess && releasingTradeId) {
      setReleaseSuccess(releasingTradeId);
      setReleasingTradeId(null);
      // Update toast to success
      if (releaseToastId) {
        updateToast(releaseToastId, {
          type: 'success',
          title: 'Escrow released',
          message: `Trade #${releasingTradeId} funds released to your wallet.`,
        });
        setReleaseToastId(null);
      }
      // Refetch trades after successful release
      refetchCounter();
      refetchTrades();
      // Clear success message after 5 seconds
      setTimeout(() => setReleaseSuccess(null), 5000);
    }
  }, [isReleaseSuccess, releasingTradeId, releaseToastId, updateToast, refetchCounter, refetchTrades]);

  // Handle dispute trade success
  useEffect(() => {
    if (isDisputeSuccess && disputingTradeId) {
      setDisputeSuccess(disputingTradeId);
      setDisputingTradeId(null);
      // Update toast to success
      if (disputeToastId) {
        updateToast(disputeToastId, {
          type: 'success',
          title: 'Trade disputed',
          message: `Trade #${disputingTradeId} marked for dispute. Awaiting resolution.`,
        });
        setDisputeToastId(null);
      }
      // Refetch trades after successful dispute
      refetchCounter();
      refetchTrades();
      // Clear success message after 5 seconds
      setTimeout(() => setDisputeSuccess(null), 5000);
    }
  }, [isDisputeSuccess, disputingTradeId, disputeToastId, updateToast, refetchCounter, refetchTrades]);

  // Process trades data and fetch seller scores
  useEffect(() => {
    if (!tradesData) {
      // Show mock trades when no contract data
      if (!isLoadingCounter && !isLoadingTrades) {
        setDisplayTrades(mockTrades);
      }
      return;
    }

    const activeTrades: DisplayTrade[] = [];
    const sellersToFetch: Set<string> = new Set();
    const tokensToFetch: Set<string> = new Set();

    tradesData.forEach((result) => {
      if (result.status === 'success' && result.result) {
        // Type assertion through unknown for complex contract return types
        const trade = result.result as unknown as Trade;

        // Only show active trades
        if (trade.status === TradeStatus.Active) {
          sellersToFetch.add(trade.seller);
          tokensToFetch.add(trade.token);

          const cachedSymbol = getCachedTokenInfo(trade.token)?.symbol;
          const displaySymbol = tokenSymbols[trade.token] || cachedSymbol || getTokenDisplayName(trade.token);

          activeTrades.push({
            id: trade.id.toString(),
            seller: `${trade.seller.slice(0, 6)}...${trade.seller.slice(-4)}`,
            sellerFull: trade.seller,
            sellerScore: sellerScores[trade.seller] || 0,
            tokenAmount: formatEther(trade.tokenAmount),
            ethPrice: formatEther(trade.ethPrice),
            ethPriceRaw: trade.ethPrice,
            feeBasisPoints: Number(trade.feeBasisPoints),
            status: 'Active',
            statusCode: trade.status,
            token: `${trade.token.slice(0, 6)}...${trade.token.slice(-4)}`,
            tokenSymbol: displaySymbol,
            tokenAddress: trade.token,
            createdAt: Number(trade.createdAt),
            executedAt: Number(trade.executedAt || 0),
            escrowDuration: Number(trade.escrowDuration || 86400),
            disputed: trade.disputed || false,
          });
        }
      }
    });

    // Fetch Ethos scores for sellers we haven't fetched yet
    sellersToFetch.forEach(async (seller) => {
      if (!sellerScores[seller]) {
        const score = await fetchEthosScore(seller);
        setSellerScores((prev) => ({ ...prev, [seller]: score.score }));
      }
    });

    // If no active trades from contract, show mock trades
    if (activeTrades.length === 0) {
      setDisplayTrades(mockTrades);
    } else {
      setDisplayTrades(activeTrades);
    }
  }, [tradesData, sellerScores, tokenSymbols, isLoadingCounter, isLoadingTrades]);

  // Update seller scores in display trades when scores are fetched
  useEffect(() => {
    setDisplayTrades((prev) =>
      prev.map((trade) => ({
        ...trade,
        sellerScore: sellerScores[trade.sellerFull] || trade.sellerScore,
      }))
    );
  }, [sellerScores]);

  const handleBuy = async (trade: DisplayTrade) => {
    if (!isConnected) {
      addToast({
        type: 'error',
        title: 'Wallet not connected',
        message: 'Please connect your wallet first',
      });
      return;
    }

    // Check if user is trying to buy their own trade
    if (userAddress?.toLowerCase() === trade.sellerFull.toLowerCase()) {
      addToast({
        type: 'error',
        title: 'Cannot buy own trade',
        message: 'You cannot purchase your own listing',
      });
      return;
    }

    // Calculate total cost (price + fee)
    const feeAmount = (trade.ethPriceRaw * BigInt(trade.feeBasisPoints)) / 10000n;
    const totalCost = trade.ethPriceRaw + feeAmount;

    setBuyingTradeId(trade.id);

    // Show loading toast
    const toastId = addToast({
      type: 'loading',
      title: 'Processing purchase...',
      message: `Buying ${trade.tokenSymbol} for ${trade.ethPrice} ETH`,
    });
    setBuyToastId(toastId);

    try {
      executeBuy({
        address: TRUSTTRADE_ADDRESS,
        abi: TRUSTTRADE_ABI,
        functionName: 'executeTrade',
        args: [BigInt(trade.id)],
        value: totalCost,
      });
    } catch (error) {
      console.error('Buy error:', error);
      setBuyingTradeId(null);
      updateToast(toastId, {
        type: 'error',
        title: 'Purchase failed',
        message: 'Transaction could not be initiated',
      });
    }
  };

  const handleCancel = async (trade: DisplayTrade) => {
    if (!isConnected) {
      addToast({
        type: 'error',
        title: 'Wallet not connected',
        message: 'Please connect your wallet first',
      });
      return;
    }

    // Only the seller can cancel their own trade
    if (userAddress?.toLowerCase() !== trade.sellerFull.toLowerCase()) {
      addToast({
        type: 'error',
        title: 'Unauthorized',
        message: 'You can only cancel your own trades',
      });
      return;
    }

    setCancellingTradeId(trade.id);

    // Show loading toast
    const toastId = addToast({
      type: 'loading',
      title: 'Cancelling trade...',
      message: `Cancelling trade #${trade.id}`,
    });
    setCancelToastId(toastId);

    try {
      executeCancel({
        address: TRUSTTRADE_ADDRESS,
        abi: TRUSTTRADE_ABI,
        functionName: 'cancelTrade',
        args: [BigInt(trade.id)],
      });
    } catch (error) {
      console.error('Cancel error:', error);
      setCancellingTradeId(null);
      updateToast(toastId, {
        type: 'error',
        title: 'Cancellation failed',
        message: 'Transaction could not be initiated',
      });
      setShowCancelConfirm(null);
    }
  };

  const handleReleaseEscrow = async (trade: DisplayTrade) => {
    if (!isConnected) {
      addToast({
        type: 'error',
        title: 'Wallet not connected',
        message: 'Please connect your wallet first',
      });
      return;
    }

    // Only the seller can release escrow
    if (userAddress?.toLowerCase() !== trade.sellerFull.toLowerCase()) {
      addToast({
        type: 'error',
        title: 'Unauthorized',
        message: 'Only the seller can release escrow',
      });
      return;
    }

    setReleasingTradeId(trade.id);

    // Show loading toast
    const toastId = addToast({
      type: 'loading',
      title: 'Releasing escrow...',
      message: `Releasing funds for trade #${trade.id}`,
    });
    setReleaseToastId(toastId);

    try {
      executeRelease({
        address: TRUSTTRADE_ADDRESS,
        abi: TRUSTTRADE_ABI,
        functionName: 'releaseEscrow',
        args: [BigInt(trade.id)],
      });
    } catch (error) {
      console.error('Release escrow error:', error);
      setReleasingTradeId(null);
      updateToast(toastId, {
        type: 'error',
        title: 'Release failed',
        message: 'Transaction could not be initiated',
      });
    }
  };

  const handleDisputeTrade = async (trade: DisplayTrade) => {
    if (!isConnected) {
      addToast({
        type: 'error',
        title: 'Wallet not connected',
        message: 'Please connect your wallet first',
      });
      return;
    }

    // Only the buyer can dispute
    if (trade.statusCode !== TradeStatus.Escrow) {
      addToast({
        type: 'error',
        title: 'Cannot dispute',
        message: 'Trade must be in escrow to dispute',
      });
      return;
    }

    setDisputingTradeId(trade.id);

    // Show loading toast
    const toastId = addToast({
      type: 'loading',
      title: 'Initiating dispute...',
      message: `Marking trade #${trade.id} for dispute`,
    });
    setDisputeToastId(toastId);

    try {
      executeDispute({
        address: TRUSTTRADE_ADDRESS,
        abi: TRUSTTRADE_ABI,
        functionName: 'disputeTrade',
        args: [BigInt(trade.id), 'Trade dispute initiated by buyer'],
      });
    } catch (error) {
      console.error('Dispute error:', error);
      setDisputingTradeId(null);
      updateToast(toastId, {
        type: 'error',
        title: 'Dispute failed',
        message: 'Transaction could not be initiated',
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 2000) return 'text-green-400';
    if (score >= 1000) return 'text-blue-400';
    return 'text-orange-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 2000) return { label: 'VIP', color: 'bg-green-500/20 text-green-400' };
    if (score >= 1000) return { label: 'Verified', color: 'bg-blue-500/20 text-blue-400' };
    return { label: 'New Trader', color: 'bg-orange-500/20 text-orange-400' };
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const isLoading = isLoadingCounter || isLoadingTrades;

  // Filter and sort trades
  const filteredTrades = useMemo(() => {
    let filtered = [...displayTrades];

    // Search by token address or seller address
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (trade) =>
          trade.tokenAddress.toLowerCase().includes(query) ||
          trade.sellerFull.toLowerCase().includes(query) ||
          trade.token.toLowerCase().includes(query)
      );
    }

    // Filter by price range
    if (priceMin) {
      const minPrice = parseFloat(priceMin);
      if (!isNaN(minPrice)) {
        filtered = filtered.filter((trade) => parseFloat(trade.ethPrice) >= minPrice);
      }
    }
    if (priceMax) {
      const maxPrice = parseFloat(priceMax);
      if (!isNaN(maxPrice)) {
        filtered = filtered.filter((trade) => parseFloat(trade.ethPrice) <= maxPrice);
      }
    }

    // Filter by fee tier
    if (feeTierFilter !== 'all') {
      filtered = filtered.filter((trade) => {
        switch (feeTierFilter) {
          case 'vip':
            return trade.feeBasisPoints === 0;
          case 'standard':
            return trade.feeBasisPoints === 100;
          case 'new':
            return trade.feeBasisPoints === 250;
          default:
            return true;
        }
      });
    }

    // Filter my trades only
    if (showMyTrades && userAddress) {
      filtered = filtered.filter(
        (trade) => trade.sellerFull.toLowerCase() === userAddress.toLowerCase()
      );
    }

    // Sort trades
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'price_low':
        filtered.sort((a, b) => parseFloat(a.ethPrice) - parseFloat(b.ethPrice));
        break;
      case 'price_high':
        filtered.sort((a, b) => parseFloat(b.ethPrice) - parseFloat(a.ethPrice));
        break;
      case 'trust':
        filtered.sort((a, b) => b.sellerScore - a.sellerScore);
        break;
    }

    return filtered;
  }, [displayTrades, searchQuery, priceMin, priceMax, feeTierFilter, sortBy, showMyTrades, userAddress]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (priceMin) count++;
    if (priceMax) count++;
    if (feeTierFilter !== 'all') count++;
    if (showMyTrades) count++;
    return count;
  }, [priceMin, priceMax, feeTierFilter, showMyTrades]);

  const clearFilters = () => {
    setSearchQuery('');
    setPriceMin('');
    setPriceMax('');
    setFeeTierFilter('all');
    setSortBy('newest');
    setShowMyTrades(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card p-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-xl sm:text-2xl font-bold">Active Trades</h3>
        <div className="flex items-center gap-2 px-3 py-1 bg-teal-500/20 rounded-full w-fit">
          <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
          <span className="text-xs sm:text-sm text-teal-400">Live</span>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-3 sm:space-y-4">
        {/* Search and Quick Actions */}
        <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search token or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 sm:py-2.5 bg-gray-800/50 border border-white/10 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-teal-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border transition-all whitespace-nowrap flex-shrink-0 ${
              showFilters || activeFilterCount > 0
                ? 'bg-teal-500/20 border-teal-500/50 text-teal-400'
                : 'bg-gray-800/50 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-teal-500 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="relative flex-shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="appearance-none pl-3 sm:pl-4 pr-9 sm:pr-10 py-2 sm:py-2.5 bg-gray-800/50 border border-white/10 rounded-lg text-xs sm:text-sm text-gray-300 focus:outline-none focus:border-teal-500/50 transition-colors cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price_low">Price ↓</option>
              <option value="price_high">Price ↑</option>
              <option value="trust">Trusted</option>
            </select>
            <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none flex-shrink-0" />
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 sm:p-4 bg-gray-800/30 rounded-lg border border-white/5"
          >
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Price Range */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Price Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-700/50 border border-white/10 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-teal-500/50"
                  />
                  <span className="text-gray-500 text-xs sm:text-sm flex-shrink-0">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-700/50 border border-white/10 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              </div>

              {/* Fee Tier Filter */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Fee Tier</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'All', color: 'gray' },
                    { value: 'vip', label: 'VIP', color: 'green' },
                    { value: 'standard', label: '1%', color: 'blue' },
                    { value: 'new', label: '2.5%', color: 'orange' },
                  ].map((tier) => (
                    <button
                      key={tier.value}
                      onClick={() => setFeeTierFilter(tier.value as typeof feeTierFilter)}
                      className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs rounded-lg border transition-all ${
                        feeTierFilter === tier.value
                          ? tier.color === 'green'
                            ? 'bg-green-500/20 border-green-500/50 text-green-400'
                            : tier.color === 'blue'
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                            : tier.color === 'orange'
                            ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                            : 'bg-teal-500/20 border-teal-500/50 text-teal-400'
                          : 'bg-gray-700/50 border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* My Trades Toggle */}
              <div className="flex flex-col justify-start">
                <label className="block text-xs text-gray-400 mb-2">Show Only</label>
                <button
                  onClick={() => setShowMyTrades(!showMyTrades)}
                  disabled={!isConnected}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border transition-all w-fit ${
                    showMyTrades
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                      : 'bg-gray-700/50 border-white/10 text-gray-400 hover:border-white/20'
                  } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  My Trades
                </button>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end justify-start">
                <button
                  onClick={clearFilters}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Count */}
        {(searchQuery || activeFilterCount > 0) && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              Showing {filteredTrades.length} of {displayTrades.length} trades
            </span>
            {(searchQuery || activeFilterCount > 0) && (
              <button
                onClick={clearFilters}
                className="text-teal-400 hover:text-teal-300 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Buy Error Message */}
      {buyError && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400 text-sm">
            Purchase failed: {buyError.message.includes('User rejected') ? 'Transaction rejected' : 'Please try again'}
          </p>
        </div>
      )}

      {/* Cancel Error Message */}
      {cancelError && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400 text-sm">
            Cancellation failed: {cancelError.message.includes('User rejected') ? 'Transaction rejected' : 'Please try again'}
          </p>
        </div>
      )}

      {/* Buy Success Message */}
      {txSuccess && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-green-400 text-sm">
            Trade #{txSuccess} purchased successfully!
          </p>
        </div>
      )}

      {/* Cancel Success Message */}
      {cancelSuccess && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-green-400 text-sm">
            Trade #{cancelSuccess} cancelled successfully! Your tokens have been returned.
          </p>
        </div>
      )}

      {/* Release Escrow Success Message */}
      {releaseSuccess && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-green-400 text-sm">
            Trade #{releaseSuccess} escrow released! Funds transferred to your wallet.
          </p>
        </div>
      )}

      {/* Dispute Success Message */}
      {disputeSuccess && (
        <div className="mb-4 p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-orange-400" />
          <p className="text-orange-400 text-sm">
            Trade #{disputeSuccess} marked for dispute. Admin will review and resolve.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <TradeCardSkeleton />
            <TradeCardSkeleton />
            <TradeCardSkeleton />
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="text-center py-12">
            {displayTrades.length === 0 ? (
              <>
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400">No active trades yet</p>
                <p className="text-sm text-gray-500 mt-1">Be the first to create a trade!</p>
              </>
            ) : (
              <>
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400">No trades match your filters</p>
                <button
                  onClick={clearFilters}
                  className="mt-3 text-sm text-teal-400 hover:text-teal-300 transition-colors"
                >
                  Clear filters to see all trades
                </button>
              </>
            )}
          </div>
        ) : (
          filteredTrades.map((trade, index) => {
            const badge = getScoreBadge(trade.sellerScore);
            const isCurrentlyBuying = buyingTradeId === trade.id || (isBuyConfirming && buyingTradeId === trade.id);
            const isCurrentlyCancelling = cancellingTradeId === trade.id || (isCancelConfirming && cancellingTradeId === trade.id);
            const isOwnTrade = userAddress?.toLowerCase() === trade.sellerFull.toLowerCase();
            const feeAmount = (trade.ethPriceRaw * BigInt(trade.feeBasisPoints)) / 10000n;
            const totalCost = trade.ethPriceRaw + feeAmount;
            const showingCancelConfirm = showCancelConfirm === trade.id;

            return (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 sm:p-6 bg-gray-800/30 rounded-lg border transition-all hover-lift ${
                  txSuccess === trade.id
                    ? 'border-green-500/50'
                    : 'border-white/5 hover:border-teal-500/30'
                }`}
              >
                <div className="flex flex-col gap-4">
                  {/* Seller Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <UserProfile
                        address={trade.sellerFull || trade.seller}
                        score={trade.sellerScore}
                        size="md"
                        showDetails={true}
                      />
                      {isOwnTrade && (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 flex-shrink-0 h-fit">
                          Your Trade
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Trade Details Grid */}
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    <div className="text-center p-2 sm:p-3 bg-gray-900/40 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Selling</p>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-teal-400 flex-shrink-0" />
                        <p className="font-semibold text-xs sm:text-sm truncate">{parseFloat(trade.tokenAmount).toLocaleString()}</p>
                      </div>
                      <p className="text-xs text-teal-400 font-medium">{trade.tokenSymbol}</p>
                      <p className="text-xs text-gray-500 font-mono truncate">{trade.token}</p>
                    </div>

                    <div className="text-center p-2 sm:p-3 bg-gray-900/40 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Price</p>
                      <p className="text-lg sm:text-2xl font-bold text-teal-400 truncate">{trade.ethPrice}</p>
                      <p className="text-xs text-gray-500">ETH</p>
                      <p className="text-xs text-gray-600 mt-1 truncate">Total: {formatEther(totalCost)}</p>
                    </div>

                    <div className="text-center p-2 sm:p-3 bg-gray-900/40 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Fee</p>
                      <p className={`text-lg sm:text-xl font-semibold ${
                        trade.feeBasisPoints === 0
                          ? 'text-green-400'
                          : trade.feeBasisPoints === 100
                          ? 'text-blue-400'
                          : 'text-orange-400'
                      }`}>
                        {trade.feeBasisPoints / 100}%
                      </p>
                    </div>
                  </div>

                  {/* Trust Indicator */}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>Listed {formatTimeAgo(trade.createdAt)}</span>
                    </div>
                    {trade.sellerScore >= 2000 && (
                      <div className="text-xs text-green-400 flex items-center gap-1">
                        <span>✓</span>
                        <span>Trusted</span>
                      </div>
                    )}
                  </div>

                  {/* Escrow Timer - Show only for trades in escrow status */}
                  {trade.statusCode === TradeStatus.Escrow && trade.executedAt > 0 && (
                    <div className="pt-2">
                      <EscrowTimer
                        executedAt={trade.executedAt}
                        escrowDuration={trade.escrowDuration}
                        tradeId={Number(trade.id)}
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    {isOwnTrade ? (
                      // Cancel button for own trades
                      showingCancelConfirm ? (
                        <div className="flex items-center gap-2 w-full">
                          <button
                            onClick={() => handleCancel(trade)}
                            disabled={isCurrentlyCancelling}
                            className="flex-1 px-3 sm:px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                          >
                            {isCurrentlyCancelling ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="hidden sm:inline">{isCancelConfirming ? 'Confirming...' : 'Cancelling...'}</span>
                              </>
                            ) : (
                              'Confirm'
                            )}
                          </button>
                          <button
                            onClick={() => setShowCancelConfirm(null)}
                            disabled={isCurrentlyCancelling}
                            className="p-2 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-all flex-shrink-0"
                          >
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowCancelConfirm(trade.id)}
                          className="w-full px-3 sm:px-4 py-2 bg-gray-700/50 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:border-red-500/50 hover:text-red-400 transition-all text-xs sm:text-sm"
                        >
                          Cancel Trade
                        </button>
                      )
                    ) : (
                      // Buy button for other users' trades or escrow actions
                      trade.statusCode === TradeStatus.Escrow ? (
                        <div className="flex gap-2">
                          {/* Buyer can dispute */}
                          <button
                            onClick={() => handleDisputeTrade(trade)}
                            disabled={disputingTradeId === trade.id || !isConnected}
                            className="flex-1 px-3 sm:px-4 py-2 bg-orange-500/20 border border-orange-500/50 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                          >
                            {disputingTradeId === trade.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="hidden sm:inline">{isDisputeConfirming ? 'Confirming...' : 'Disputing...'}</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4" />
                                <span>Dispute</span>
                              </>
                            )}
                          </button>

                          {/* Seller can release escrow */}
                          {userAddress?.toLowerCase() === trade.sellerFull.toLowerCase() && (
                            <button
                              onClick={() => handleReleaseEscrow(trade)}
                              disabled={releasingTradeId === trade.id || !isConnected}
                              className="flex-1 px-3 sm:px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                            >
                              {releasingTradeId === trade.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span className="hidden sm:inline">{isReleaseConfirming ? 'Confirming...' : 'Releasing...'}</span>
                                </>
                              ) : (
                                'Release'
                              )}
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleBuy(trade)}
                          disabled={isCurrentlyBuying || !isConnected}
                          className="w-full btn-primary flex items-center justify-center gap-2 text-xs sm:text-sm py-2 sm:py-2.5"
                        >
                          {isCurrentlyBuying ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="hidden sm:inline">{isBuyConfirming ? 'Confirming...' : 'Buying...'}</span>
                              <span className="sm:hidden">{isBuyConfirming ? 'Wait...' : 'Buy...'}</span>
                            </>
                          ) : (
                            'Buy Now'
                          )}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {filteredTrades.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              refetchCounter();
              refetchTrades();
            }}
            className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
          >
            Refresh Trades →
          </button>
        </div>
      )}
    </motion.div>
  );
}

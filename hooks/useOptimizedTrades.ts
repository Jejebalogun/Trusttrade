'use client';

import { useMemo, useCallback } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { formatEther } from 'viem';
import { TRUSTTRADE_ABI, TRUSTTRADE_ADDRESS } from '@/lib/contract';

// Trade status enum matching the contract
export enum TradeStatus {
  Active = 0,
  Executed = 1,
  Cancelled = 2,
}

export interface Trade {
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

export interface ProcessedTrade {
  id: string;
  seller: string;
  sellerFull: `0x${string}`;
  buyer: string;
  buyerFull: `0x${string}`;
  tokenAmount: string;
  ethPrice: string;
  ethPriceRaw: bigint;
  feeBasisPoints: number;
  status: TradeStatus;
  statusLabel: string;
  token: string;
  tokenSymbol: string;
  tokenAddress: `0x${string}`;
  createdAt: number;
}

// Optimized hook with stale time and refetch interval settings
export function useOptimizedTrades(options?: {
  filterActive?: boolean;
  refetchInterval?: number;
}) {
  const { filterActive = false, refetchInterval = 30000 } = options || {};

  // Read trade counter with caching
  const {
    data: tradeCounter,
    isLoading: isLoadingCounter,
    refetch: refetchCounter
  } = useReadContract({
    address: TRUSTTRADE_ADDRESS,
    abi: TRUSTTRADE_ABI,
    functionName: 'tradeCounter',
    query: {
      staleTime: 10000, // Consider data fresh for 10 seconds
      refetchInterval,
    },
  });

  // Memoize trade IDs to prevent unnecessary re-renders
  const tradeIds = useMemo(() => {
    if (!tradeCounter || tradeCounter === 0n) return [];
    // Limit to last 50 trades for performance
    const count = Number(tradeCounter);
    const startIndex = Math.max(0, count - 50);
    return Array.from({ length: count - startIndex }, (_, i) => BigInt(startIndex + i));
  }, [tradeCounter]);

  // Batch read trades with optimized settings
  const {
    data: tradesData,
    isLoading: isLoadingTrades,
    refetch: refetchTrades
  } = useReadContracts({
    contracts: tradeIds.map((id) => ({
      address: TRUSTTRADE_ADDRESS,
      abi: TRUSTTRADE_ABI,
      functionName: 'getTrade',
      args: [id],
    })),
    query: {
      staleTime: 10000,
      refetchInterval,
      enabled: tradeIds.length > 0,
    },
  });

  // Process trades with memoization
  const processedTrades = useMemo(() => {
    if (!tradesData) return [];

    const trades: ProcessedTrade[] = [];

    tradesData.forEach((result) => {
      if (result.status === 'success' && result.result) {
        const trade = result.result as unknown as Trade;

        // Filter if needed
        if (filterActive && trade.status !== TradeStatus.Active) {
          return;
        }

        const getStatusLabel = (status: number) => {
          switch (status) {
            case TradeStatus.Active: return 'Active';
            case TradeStatus.Executed: return 'Completed';
            case TradeStatus.Cancelled: return 'Cancelled';
            default: return 'Unknown';
          }
        };

        trades.push({
          id: trade.id.toString(),
          seller: `${trade.seller.slice(0, 6)}...${trade.seller.slice(-4)}`,
          sellerFull: trade.seller,
          buyer: trade.buyer === '0x0000000000000000000000000000000000000000'
            ? 'No buyer yet'
            : `${trade.buyer.slice(0, 6)}...${trade.buyer.slice(-4)}`,
          buyerFull: trade.buyer,
          tokenAmount: formatEther(trade.tokenAmount),
          ethPrice: formatEther(trade.ethPrice),
          ethPriceRaw: trade.ethPrice,
          feeBasisPoints: Number(trade.feeBasisPoints),
          status: trade.status,
          statusLabel: getStatusLabel(trade.status),
          token: `${trade.token.slice(0, 6)}...${trade.token.slice(-4)}`,
          tokenSymbol: `${trade.token.slice(0, 6)}...${trade.token.slice(-4)}`,
          tokenAddress: trade.token,
          createdAt: Number(trade.createdAt),
        });
      }
    });

    // Sort by newest first
    return trades.sort((a, b) => b.createdAt - a.createdAt);
  }, [tradesData, filterActive]);

  // Memoized refetch function
  const refetch = useCallback(() => {
    refetchCounter();
    refetchTrades();
  }, [refetchCounter, refetchTrades]);

  return {
    trades: processedTrades,
    tradeCounter: tradeCounter ? Number(tradeCounter) : 0,
    isLoading: isLoadingCounter || isLoadingTrades,
    refetch,
  };
}

// Hook for user-specific trades with optimized filtering
export function useUserTrades(userAddress: `0x${string}` | undefined) {
  const { trades, isLoading, refetch } = useOptimizedTrades();

  const userTrades = useMemo(() => {
    if (!userAddress || !trades.length) {
      return { asSeller: [], asBuyer: [] };
    }

    const normalizedAddress = userAddress.toLowerCase();

    const asSeller = trades.filter(
      (t) => t.sellerFull.toLowerCase() === normalizedAddress
    );

    const asBuyer = trades.filter(
      (t) => t.buyerFull.toLowerCase() === normalizedAddress && t.status === TradeStatus.Executed
    );

    return { asSeller, asBuyer };
  }, [trades, userAddress]);

  const stats = useMemo(() => {
    const { asSeller, asBuyer } = userTrades;

    let totalVolumeAsSeller = 0n;
    let totalVolumeAsBuyer = 0n;
    let activeTrades = 0;
    let completedTrades = 0;

    asSeller.forEach((trade) => {
      if (trade.status === TradeStatus.Executed) {
        totalVolumeAsSeller += trade.ethPriceRaw;
        completedTrades++;
      } else if (trade.status === TradeStatus.Active) {
        activeTrades++;
      }
    });

    asBuyer.forEach((trade) => {
      totalVolumeAsBuyer += trade.ethPriceRaw;
    });

    return {
      totalSales: completedTrades,
      totalPurchases: asBuyer.length,
      totalVolumeAsSeller,
      totalVolumeAsBuyer,
      activeTrades,
      completedTrades,
    };
  }, [userTrades]);

  return {
    ...userTrades,
    stats,
    isLoading,
    refetch,
  };
}

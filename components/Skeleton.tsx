'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-700/50 rounded ${className}`}
    />
  );
}

export function TradeCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 bg-gray-800/30 rounded-lg border border-white/5"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Seller Info Skeleton */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-16 h-5 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="w-3 h-3" />
                <Skeleton className="w-20 h-3" />
                <Skeleton className="w-12 h-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Trade Details Skeleton */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <Skeleton className="w-12 h-3 mx-auto mb-2" />
            <Skeleton className="w-16 h-5 mx-auto mb-1" />
            <Skeleton className="w-20 h-3 mx-auto" />
          </div>

          <div className="text-center">
            <Skeleton className="w-10 h-3 mx-auto mb-2" />
            <Skeleton className="w-24 h-8 mx-auto mb-1" />
            <Skeleton className="w-20 h-3 mx-auto" />
          </div>

          <div className="text-center">
            <Skeleton className="w-8 h-3 mx-auto mb-2" />
            <Skeleton className="w-12 h-5 mx-auto" />
          </div>
        </div>

        {/* Button Skeleton */}
        <Skeleton className="w-24 h-10 rounded-lg" />
      </div>

      {/* Footer Skeleton */}
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-3 h-3" />
          <Skeleton className="w-24 h-3" />
        </div>
      </div>
    </motion.div>
  );
}

export function TradeFeedSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <TradeCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ReputationCardSkeleton() {
  return (
    <div className="glass-card p-8">
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Score Circle Skeleton */}
        <div className="relative">
          <Skeleton className="w-32 h-32 rounded-full" />
        </div>

        {/* Info Skeleton */}
        <div className="flex-1 text-center md:text-left">
          <Skeleton className="w-48 h-8 mb-2" />
          <Skeleton className="w-64 h-4 mb-4" />
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <Skeleton className="w-24 h-6 rounded-full" />
            <Skeleton className="w-20 h-6 rounded-full" />
            <Skeleton className="w-28 h-6 rounded-full" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center p-4 bg-gray-800/30 rounded-lg">
              <Skeleton className="w-12 h-6 mx-auto mb-1" />
              <Skeleton className="w-16 h-3 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-6 bg-gray-800/30 rounded-lg border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="w-20 h-4" />
          </div>
          <Skeleton className="w-16 h-8 mb-1" />
          <Skeleton className="w-24 h-3" />
        </div>
      ))}
    </div>
  );
}

export function TradeHistorySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 bg-gray-800/30 rounded-lg border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div>
                <Skeleton className="w-32 h-4 mb-1" />
                <Skeleton className="w-24 h-3" />
              </div>
            </div>
            <div className="text-right">
              <Skeleton className="w-20 h-5 mb-1" />
              <Skeleton className="w-16 h-3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

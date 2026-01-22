'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ReputationCardSkeleton, TradeFeedSkeleton, DashboardStatsSkeleton } from '@/components/Skeleton';

// Lazy load heavy components
const ReputationCard = dynamic(() => import('@/components/ReputationCard').then(mod => ({ default: mod.ReputationCard })), {
  loading: () => <ReputationCardSkeleton />,
  ssr: false,
});

const TradeForm = dynamic(() => import('@/components/TradeForm').then(mod => ({ default: mod.TradeForm })), {
  loading: () => <div className="glass-card p-8 animate-pulse h-96" />,
  ssr: false,
});

const TradeFeed = dynamic(() => import('@/components/TradeFeed').then(mod => ({ default: mod.TradeFeed })), {
  loading: () => <TradeFeedSkeleton />,
  ssr: false,
});

const TradeStats = dynamic(() => import('@/components/TradeStats').then(mod => ({ default: mod.TradeStats })), {
  loading: () => <DashboardStatsSkeleton />,
  ssr: false,
});

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <Hero />

      {/* Main Dashboard */}
      <section className="container mx-auto px-4 pb-20">
        {/* Platform Stats */}
        <ErrorBoundary>
          <TradeStats />
        </ErrorBoundary>

        {/* Reputation Card */}
        <div className="mb-8">
          <ErrorBoundary>
            <ReputationCard />
          </ErrorBoundary>
        </div>

        {/* Two Column Layout: Trade Form + Trade Feed */}
        <div className="grid lg:grid-cols-2 gap-8">
          <ErrorBoundary>
            <TradeForm />
          </ErrorBoundary>
          <ErrorBoundary>
            <TradeFeed />
          </ErrorBoundary>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            Built for Ethos Vibeathon | Powered by{' '}
            <a
              href="https://ethos.network"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300 transition-colors"
            >
              Ethos Network
            </a>{' '}
            on{' '}
            <a
              href="https://base.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300 transition-colors"
            >
              Base
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}

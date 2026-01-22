'use client';

import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ReputationCardSkeleton, DashboardStatsSkeleton, TradeHistorySkeleton } from '@/components/Skeleton';

// Lazy load heavy components
const ReputationCard = dynamic(() => import('@/components/ReputationCard').then(mod => ({ default: mod.ReputationCard })), {
  loading: () => <ReputationCardSkeleton />,
  ssr: false,
});

const Dashboard = dynamic(() => import('@/components/Dashboard').then(mod => ({ default: mod.Dashboard })), {
  loading: () => (
    <div className="space-y-8">
      <DashboardStatsSkeleton />
      <div className="glass-card p-8">
        <TradeHistorySkeleton />
      </div>
    </div>
  ),
  ssr: false,
});

export default function DashboardPage() {
  return (
    <main className="min-h-screen">
      <Header />

      {/* Dashboard Header */}
      <section className="pt-32 pb-8">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-2">
            My <span className="gradient-text">Dashboard</span>
          </h2>
          <p className="text-gray-400">
            Track your trading activity and history
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 pb-20">
        {/* Reputation Card */}
        <div className="mb-8">
          <ErrorBoundary>
            <ReputationCard />
          </ErrorBoundary>
        </div>

        {/* Dashboard */}
        <ErrorBoundary>
          <Dashboard />
        </ErrorBoundary>
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

import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/Skeleton';

const Analytics = dynamic(() => import('@/components/Analytics').then(mod => ({ default: mod.Analytics })), {
  loading: () => <Skeleton />,
});

export const metadata: Metadata = {
  title: 'Analytics - TrustTrade',
  description: 'Platform analytics and trading statistics',
};

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
            <span className="bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Trading Analytics
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Real-time trading statistics and platform insights
          </p>
        </div>

        <Analytics />
      </div>
    </main>
  );
}

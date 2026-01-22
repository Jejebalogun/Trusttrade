import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/Skeleton';

const TraderProfile = dynamic(
  () => import('@/components/TraderProfile').then(mod => ({ default: mod.TraderProfile })),
  {
    loading: () => <Skeleton />,
  }
);

export const metadata: Metadata = {
  title: 'Trader Profile - TrustTrade',
  description: 'View trader profile and trading history',
};

interface PageProps {
  params: {
    address: string;
  };
}

export default function ProfilePage({ params }: PageProps) {
  const { address } = params;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <TraderProfile address={address} />
      </div>
    </main>
  );
}

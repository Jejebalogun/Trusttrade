'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Shield, Zap } from 'lucide-react';

// Memoized feature cards data
const featureCards = [
  {
    icon: Shield,
    iconColor: 'text-green-400',
    bgColor: 'bg-green-500/20',
    title: 'Score ≥ 2000',
    fee: '0% Fee',
    feeColor: 'text-green-400',
    subtitle: 'VIP Trustless Tier',
  },
  {
    icon: TrendingUp,
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    title: 'Score 1000-1999',
    fee: '1% Fee',
    feeColor: 'text-blue-400',
    subtitle: 'Standard Tier',
  },
  {
    icon: Zap,
    iconColor: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    title: 'Score < 1000',
    fee: '2.5% Fee',
    feeColor: 'text-orange-400',
    subtitle: 'High Risk Tier',
  },
];

// Memoized FeatureCard component
const FeatureCard = memo(function FeatureCard({
  icon: Icon,
  iconColor,
  bgColor,
  title,
  fee,
  feeColor,
  subtitle,
}: typeof featureCards[0]) {
  return (
    <div className="glass-card p-6 hover-lift">
      <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-4 mx-auto`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className={`text-3xl font-bold ${feeColor} mb-2`}>{fee}</p>
      <p className="text-sm text-gray-400">{subtitle}</p>
    </div>
  );
});

export const Hero = memo(function Hero() {
  // Memoize the feature cards rendering
  const renderedCards = useMemo(
    () => featureCards.map((card, index) => <FeatureCard key={index} {...card} />),
    []
  );

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Static background grid - no heavy animations */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(20, 184, 166, 0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6 fade-in">
            <Zap className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-gray-300">Powered by Ethos Network</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text">TrustTrade:</span>
            <br />
            <span className="text-white">Reputation is Currency</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Trade ETH for tokens directly with dynamic fees based on your Ethos credibility score.
            The higher your reputation, the lower your fees.
          </p>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {renderedCards}
          </div>
        </motion.div>
      </div>

      {/* Gradient orbs - static, no animations */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
});

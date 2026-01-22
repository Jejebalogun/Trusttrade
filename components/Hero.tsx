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
    <div className="glass-card p-4 sm:p-6 hover-lift">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${bgColor} rounded-lg flex items-center justify-center mb-3 sm:mb-4 mx-auto`}>
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
      </div>
      <h3 className="text-base sm:text-lg font-semibold mb-2">{title}</h3>
      <p className={`text-2xl sm:text-3xl font-bold ${feeColor} mb-2`}>{fee}</p>
      <p className="text-xs sm:text-sm text-gray-400">{subtitle}</p>
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
    <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 overflow-hidden">
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
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass-card mb-6 fade-in text-xs sm:text-sm">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-teal-400 flex-shrink-0" />
            <span className="text-gray-300">Powered by Ethos Network</span>
          </div>

          {/* Main heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
            <span className="gradient-text">TrustTrade:</span>
            <br />
            <span className="text-white">Reputation is Currency</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-xl text-gray-400 mb-8 sm:mb-12 max-w-2xl mx-auto">
            Trade ETH for tokens directly with dynamic fees based on your Ethos credibility score.
            The higher your reputation, the lower your fees.
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
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

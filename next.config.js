/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Force Next.js to bundle these packages so our webpack rules apply to them
  transpilePackages: ['@rainbow-me/rainbowkit', 'wagmi', '@metamask/sdk'],

  webpack: (config) => {
    // 2. Ignore the React Native storage module
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    };

    // 3. Ignore standard Node.js modules that break the browser build
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // 4. Prevent errors from logging libraries used by Wagmi
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    return config;
  },
};

module.exports = nextConfig;
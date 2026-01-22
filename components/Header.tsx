'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Zap, Home, LayoutDashboard, BarChart3, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import UserProfileModal from './UserProfileModal';
import { useAccount } from 'wagmi';

export function Header() {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg flex items-center justify-center glow-teal">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">TrustTrade</h1>
              <p className="text-xs text-gray-400">Reputation is Currency</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-gray-800/50 rounded-lg">
            <Link
              href="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                pathname === '/'
                  ? 'bg-teal-500/20 text-teal-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Home className="w-4 h-4" />
              Trade
            </Link>
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                pathname === '/dashboard'
                  ? 'bg-teal-500/20 text-teal-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/analytics"
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                pathname === '/analytics'
                  ? 'bg-teal-500/20 text-teal-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Link>
          </nav>

          {/* Profile Button & Connect Wallet */}
          <div className="flex items-center gap-3">
            {isConnected && (
              <button
                onClick={() => setShowProfileModal(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-teal-500/50 hover:bg-gray-800 transition-all group"
              >
                <User className="w-4 h-4 text-teal-400 group-hover:text-teal-300" />
                <span className="text-sm font-medium text-gray-300 group-hover:text-white">Profile</span>
              </button>
            )}
            <ConnectButton />
          </div>

          <UserProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
          />
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center gap-2 mt-4 p-1 bg-gray-800/50 rounded-lg">
          <Link
            href="/"
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              pathname === '/'
                ? 'bg-teal-500/20 text-teal-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            Trade
          </Link>
          <Link
            href="/dashboard"
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              pathname === '/dashboard'
                ? 'bg-teal-500/20 text-teal-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/analytics"
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              pathname === '/analytics'
                ? 'bg-teal-500/20 text-teal-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Link>
          {isConnected && (
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50"
            >
              <User className="w-4 h-4" />
              Profile
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

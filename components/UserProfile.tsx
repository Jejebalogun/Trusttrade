'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { fetchEnsAvatar, fetchEnsName, formatAddressShort } from '@/lib/ens';
import { SocialLinks } from './SocialLinks';

interface UserProfileProps {
  address: `0x${string}`;
  ensName?: string;
  twitter?: string;
  discord?: string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

export function UserProfile({
  address,
  ensName: initialEnsName,
  twitter,
  discord,
  score,
  size = 'md',
  showDetails = true,
  className = '',
}: UserProfileProps) {
  const [avatar, setAvatar] = useState<string>('');
  const [ensName, setEnsName] = useState<string | null>(initialEnsName || null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch ENS avatar and name
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        // Fetch avatar
        const avatarUrl = await fetchEnsAvatar(address);
        setAvatar(avatarUrl);

        // Fetch ENS name if not provided
        if (!initialEnsName) {
          const name = await fetchEnsName(address);
          setEnsName(name);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [address, initialEnsName]);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sizeMap = {
    sm: {
      avatar: 'w-8 h-8',
      container: 'gap-2',
    },
    md: {
      avatar: 'w-12 h-12',
      container: 'gap-3',
    },
    lg: {
      avatar: 'w-16 h-16',
      container: 'gap-4',
    },
  };

  const sizeClass = sizeMap[size];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center ${sizeClass.container} ${className}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 rounded-full bg-gray-700 overflow-hidden border-2 border-teal-500/30 ${sizeClass.avatar}`}>
        {isLoading ? (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 animate-pulse" />
        ) : (
          <img
            src={avatar}
            alt={ensName || formatAddressShort(address)}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${address.slice(2)}`;
            }}
          />
        )}
      </div>

      {/* Details */}
      {showDetails && (
        <div className="flex-1 min-w-0">
          {/* ENS Name or Address */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-sm truncate text-white">
              {ensName ? (
                <span className="text-teal-400">{ensName}</span>
              ) : (
                <span className="font-mono text-xs">{formatAddressShort(address)}</span>
              )}
            </h3>
            <button
              onClick={copyAddress}
              className="p-1 hover:bg-gray-700/50 rounded transition-colors flex-shrink-0"
              title="Copy address"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3 text-gray-400 hover:text-gray-300" />
              )}
            </button>
          </div>

          {/* Address (if ENS name shown) */}
          {ensName && (
            <p className="text-xs text-gray-400 font-mono mb-2 truncate">
              {formatAddressShort(address)}
            </p>
          )}

          {/* Score and Social Links Container */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Score Badge */}
            {score !== undefined && (
              <div className="flex items-center gap-1 px-2 py-1 bg-teal-500/20 border border-teal-500/30 rounded text-xs">
                <span className="text-gray-400">Score:</span>
                <span className="font-bold text-teal-400">{score.toLocaleString()}</span>
              </div>
            )}

            {/* Social Links */}
            <SocialLinks twitter={twitter} discord={discord} size="sm" />
          </div>
        </div>
      )}

      {/* BaseScan Link (if not showing details) */}
      {!showDetails && (
        <a
          href={`https://basescan.org/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 hover:bg-gray-700/50 rounded transition-colors flex-shrink-0"
          title="View on BaseScan"
        >
          <ExternalLink className="w-4 h-4 text-gray-400 hover:text-teal-400" />
        </a>
      )}
    </motion.div>
  );
}

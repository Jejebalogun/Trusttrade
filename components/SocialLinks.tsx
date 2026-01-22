'use client';

import { Twitter, MessageCircle, ExternalLink } from 'lucide-react';

interface SocialLinksProps {
  twitter?: string;
  discord?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export function SocialLinks({
  twitter,
  discord,
  size = 'md',
  showLabels = false,
}: SocialLinksProps) {
  if (!twitter && !discord) {
    return null;
  }

  const iconSizeMap = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const paddingMap = {
    sm: 'px-2 py-1',
    md: 'px-3 py-1.5',
    lg: 'px-4 py-2',
  };

  const textSizeMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSize = iconSizeMap[size];
  const padding = paddingMap[size];
  const textSize = textSizeMap[size];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {twitter && (
        <a
          href={`https://twitter.com/${twitter}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-1 ${padding} bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 rounded transition-all group`}
          title={`Follow ${twitter} on X/Twitter`}
        >
          <Twitter className={`${iconSize} flex-shrink-0`} />
          {showLabels && <span className={`${textSize} hidden sm:inline group-hover:text-blue-300`}>{twitter}</span>}
          <ExternalLink className={`${iconSize} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0`} />
        </a>
      )}

      {discord && (
        <div
          className={`flex items-center gap-1 ${padding} bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded`}
          title={`Discord: ${discord}`}
        >
          <MessageCircle className={`${iconSize} flex-shrink-0`} />
          {showLabels && <span className={`${textSize} hidden sm:inline`}>{discord}</span>}
        </div>
      )}
    </div>
  );
}

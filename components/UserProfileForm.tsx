'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserProfileFormProps {
  initialTwitter?: string;
  initialDiscord?: string;
  onSubmit: (data: { twitter?: string; discord?: string }) => Promise<void>;
  onClose?: () => void;
  isOpen?: boolean;
}

export default function UserProfileForm({
  initialTwitter = '',
  initialDiscord = '',
  onSubmit,
  onClose,
  isOpen = true,
}: UserProfileFormProps) {
  const [twitter, setTwitter] = useState(initialTwitter);
  const [discord, setDiscord] = useState(initialDiscord);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validate Twitter handle format
  const isValidTwitter = (handle: string) => {
    if (!handle) return true; // Optional field
    return /^[A-Za-z0-9_]{1,15}$/.test(handle);
  };

  // Validate Discord username format
  const isValidDiscord = (username: string) => {
    if (!username) return true; // Optional field
    return /^.{2,32}#[0-9]{4}$/.test(username) || /^[A-Za-z0-9_-]{2,32}$/.test(username);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate inputs
    if (!isValidTwitter(twitter)) {
      setError('Twitter handle must be 1-15 alphanumeric characters or underscores');
      return;
    }

    if (!isValidDiscord(discord)) {
      setError(
        'Discord username must be 2-32 characters (alphanumeric, underscore, hyphen) or in format username#0000'
      );
      return;
    }

    // Check if at least one social is provided
    if (!twitter && !discord) {
      setError('Please provide at least one social handle');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        twitter: twitter || undefined,
        discord: discord || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setTwitter(initialTwitter);
    setDiscord(initialDiscord);
    setError(null);
    setSuccess(false);
  };

  if (!isOpen && onClose) {
    return null;
  }

  const content = (
    <div className="w-full max-w-md">
      <div className="relative bg-gray-900/95 backdrop-blur-md border border-teal-500/30 rounded-xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
            Edit Profile
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Twitter Handle */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Twitter/X Handle
              <span className="text-gray-500 font-normal ml-1">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">@</span>
              <input
                type="text"
                value={twitter}
                onChange={(e) => {
                  setTwitter(e.target.value);
                  setError(null);
                }}
                placeholder="your_handle"
                maxLength={15}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-6 pr-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">1-15 characters, alphanumeric and underscores only</p>
          </div>

          {/* Discord Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Discord Username
              <span className="text-gray-500 font-normal ml-1">(optional)</span>
            </label>
            <input
              type="text"
              value={discord}
              onChange={(e) => {
                setDiscord(e.target.value);
                setError(null);
              }}
              placeholder="username or username#0000"
              maxLength={37}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              With or without discriminator (#0000)
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-300">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-3 p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg"
              >
                <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-teal-300">Profile updated successfully!</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {onClose && (
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-medium hover:bg-gray-700 hover:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-medium hover:bg-gray-700 hover:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg text-white font-medium hover:from-teal-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Return as modal or standalone form
  if (onClose) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {content}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return content;
}

'use client';

import { useState, useEffect } from 'react';
import UserProfileForm from './UserProfileForm';
import { useSetUserProfile, useGetUserProfile } from '@/hooks/useUserProfile';
import { useAccount } from 'wagmi';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress?: string;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  userAddress,
}: UserProfileModalProps) {
  const { address } = useAccount();
  const targetAddress = userAddress || address;

  const [initialTwitter, setInitialTwitter] = useState('');
  const [initialDiscord, setInitialDiscord] = useState('');

  // Fetch existing profile data
  const { profile, isLoading: isLoadingProfile } = useGetUserProfile(
    targetAddress?.toLowerCase() as `0x${string}`
  );

  // Initialize form with existing data
  useEffect(() => {
    if (profile) {
      setInitialTwitter(profile.twitter || '');
      setInitialDiscord(profile.discord || '');
    }
  }, [profile]);

  const { setProfile, isLoading: isSettingProfile } = useSetUserProfile({
    onSuccess: () => {
      onClose();
    },
    onError: (error) => {
      console.error('Failed to update profile:', error);
    },
  });

  const handleSubmit = async (data: { twitter?: string; discord?: string }) => {
    if (!targetAddress) {
      throw new Error('Please connect your wallet first');
    }

    try {
      await setProfile(data.twitter || '', data.discord || '');
    } catch (error) {
      throw error;
    }
  };

  return (
    <UserProfileForm
      isOpen={isOpen}
      onClose={onClose}
      initialTwitter={initialTwitter}
      initialDiscord={initialDiscord}
      onSubmit={handleSubmit}
    />
  );
}

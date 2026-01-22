import { useWriteContract, useReadContract } from 'wagmi';
import { useCallback, useState } from 'react';
import { TRUSTTRADE_ADDRESS, TRUSTTRADE_ABI } from '@/lib/contract';

interface UseUserProfileProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useSetUserProfile({ onSuccess, onError }: UseUserProfileProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  
  const { writeContractAsync } = useWriteContract();

  const setProfile = useCallback(
    async (twitter: string = '', discord: string = '') => {
      if (!twitter && !discord) {
        throw new Error('At least one social link required');
      }

      if (twitter.length > 15) {
        throw new Error('Twitter handle must be 15 characters or less');
      }

      if (discord.length > 37) {
        throw new Error('Discord username must be 37 characters or less');
      }

      setIsLoading(true);

      try {
        const hash = await writeContractAsync({
          address: TRUSTTRADE_ADDRESS,
          abi: TRUSTTRADE_ABI,
          functionName: 'setUserProfile',
          args: [twitter, discord],
        });

        onSuccess?.();
        return hash;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to set user profile');
        onError?.(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [writeContractAsync, onSuccess, onError]
  );

  return {
    setProfile,
    isLoading,
  };
}

export function useGetUserProfile(userAddress?: string) {
  const { data, isLoading, error } = useReadContract({
    address: TRUSTTRADE_ADDRESS,
    abi: TRUSTTRADE_ABI,
    functionName: 'getUserProfile',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    profile: data as { twitter: string; discord: string; updatedAt: bigint } | undefined,
    isLoading,
    error,
  };
}

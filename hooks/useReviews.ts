import { useWriteContract, useReadContract } from 'wagmi';
import { useCallback, useState } from 'react';
import { TRUSTTRADE_ADDRESS, TRUSTTRADE_ABI } from '@/lib/contract';

interface UseReviewsProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useSubmitReview({ onSuccess, onError }: UseReviewsProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();

  const submitReview = useCallback(
    async (reviewee: string, rating: number, comment: string) => {
      if (!reviewee || !rating || !comment) {
        throw new Error('All fields required');
      }

      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      if (comment.length < 10 || comment.length > 500) {
        throw new Error('Comment must be between 10 and 500 characters');
      }

      setIsLoading(true);

      try {
        const hash = await writeContractAsync({
          address: TRUSTTRADE_ADDRESS,
          abi: TRUSTTRADE_ABI,
          functionName: 'submitReview',
          args: [reviewee as `0x${string}`, rating, comment],
        });

        onSuccess?.();
        return hash;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to submit review');
        onError?.(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [writeContractAsync, onSuccess, onError]
  );

  return {
    submitReview,
    isLoading,
  };
}

export function useGetUserReviews(userAddress?: string) {
  const { data, isLoading, error } = useReadContract({
    address: TRUSTTRADE_ADDRESS,
    abi: TRUSTTRADE_ABI,
    functionName: 'getUserReviews',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  const reviewIds = data ? Array.from(data as readonly bigint[]).map(id => Number(id)) : [];

  return {
    reviewIds,
    isLoading,
    error,
  };
}

export function useGetUserAverageRating(userAddress?: string) {
  const { data, isLoading, error } = useReadContract({
    address: TRUSTTRADE_ADDRESS,
    abi: TRUSTTRADE_ABI,
    functionName: 'getUserAverageRating',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  // Data is scaled by 100 (450 = 4.5 stars)
  const averageRating = data ? Number(data) / 100 : 0;

  return {
    averageRating,
    isLoading,
    error,
  };
}

export function useGetReview(reviewId?: number) {
  const { data, isLoading, error } = useReadContract({
    address: TRUSTTRADE_ADDRESS,
    abi: TRUSTTRADE_ABI,
    functionName: 'getReview',
    args: reviewId !== undefined ? [BigInt(reviewId)] : undefined,
    query: {
      enabled: reviewId !== undefined,
    },
  });

  return {
    review: data as any,
    isLoading,
    error,
  };
}

export function useMarkReviewHelpful({ onSuccess, onError }: UseReviewsProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();

  const markHelpful = useCallback(
    async (reviewId: number) => {
      setIsLoading(true);

      try {
        const hash = await writeContractAsync({
          address: TRUSTTRADE_ADDRESS,
          abi: TRUSTTRADE_ABI,
          functionName: 'markReviewHelpful',
          args: [BigInt(reviewId)],
        });

        onSuccess?.();
        return hash;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to mark review helpful');
        onError?.(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [writeContractAsync, onSuccess, onError]
  );

  return {
    markHelpful,
    isLoading,
  };
}

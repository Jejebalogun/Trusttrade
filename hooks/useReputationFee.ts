import { useState, useEffect } from 'react';
import { fetchEthosScore, getFeePercentage, getFeeTier, EthosScore } from '@/lib/ethos';

export interface ReputationFeeData {
  score: number;
  tier: string;
  feePercent: number;
  isLoading: boolean;
  error: string | null;
  ethosData: EthosScore | null;
}

/**
 * Hook to fetch and calculate reputation-based fees
 * @param address - Ethereum wallet address
 * @returns ReputationFeeData with score, tier, and fee information
 */
export function useReputationFee(address: string | undefined): ReputationFeeData {
  const [data, setData] = useState<ReputationFeeData>({
    score: 0,
    tier: 'High Risk',
    feePercent: 2.5,
    isLoading: false,
    error: null,
    ethosData: null,
  });

  useEffect(() => {
    if (!address) {
      setData({
        score: 0,
        tier: 'High Risk',
        feePercent: 2.5,
        isLoading: false,
        error: 'No address provided',
        ethosData: null,
      });
      return;
    }

    let isMounted = true;

    async function loadReputationData() {
      setData((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        if (!address) {
          setData({ score: 50, feePercent: 5, tier: 'default', isLoading: false, error: null, ethosData: null });
          return;
        }

        const ethosData = await fetchEthosScore(address);

        if (!isMounted) return;

        const score = ethosData.score;
        const tier = getFeeTier(score);
        const feePercent = getFeePercentage(score);

        setData({
          score,
          tier,
          feePercent,
          isLoading: false,
          error: null,
          ethosData,
        });
      } catch (error) {
        if (!isMounted) return;

        console.error('Error loading reputation data:', error);
        setData({
          score: 0,
          tier: 'High Risk',
          feePercent: 2.5,
          isLoading: false,
          error: 'Failed to load reputation data',
          ethosData: null,
        });
      }
    }

    loadReputationData();

    return () => {
      isMounted = false;
    };
  }, [address]);

  return data;
}

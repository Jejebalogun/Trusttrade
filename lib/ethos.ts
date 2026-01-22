/**
 * Ethos Network API Client
 * Fetches reputation scores for wallet addresses
 */

export interface EthosScore {
  address: string;
  score: number;
  level: string;
}

export interface EthosApiResponse {
  score: number;
  level: string;
}

const ETHOS_API_BASE = 'https://api.ethos.network/api/v2';
const CLIENT_HEADER = 'TrustTrade-Vibeathon';

/**
 * Fetch Ethos credibility score for a wallet address
 * @param address - Ethereum wallet address
 * @returns EthosScore object with reputation data
 */
export async function fetchEthosScore(address: string): Promise<EthosScore> {
  try {
    const response = await fetch(
      `${ETHOS_API_BASE}/score/address?address=${address}`,
      {
        headers: {
          'X-Ethos-Client': CLIENT_HEADER,
        },
      }
    );

    if (!response.ok) {
      console.error('Ethos API error:', response.status, response.statusText);
      return createDefaultScore(address);
    }

    const data: EthosApiResponse = await response.json();

    return {
      address,
      score: data.score || 0,
      level: data.level || 'untrusted',
    };
  } catch (error) {
    console.error('Failed to fetch Ethos score:', error);
    return createDefaultScore(address);
  }
}

/**
 * Create a default score object for error cases
 */
function createDefaultScore(address: string): EthosScore {
  return {
    address,
    score: 0,
    level: 'untrusted',
  };
}

/**
 * Calculate fee tier based on Ethos score
 * @param score - Ethos credibility score
 * @returns Fee tier name
 */
export function getFeePercentage(score: number): number {
  if (score >= 2000) return 0; // VIP
  if (score >= 1000) return 1; // Standard
  return 2.5; // High Risk
}

/**
 * Get fee tier name based on score
 */
export function getFeeTier(score: number): string {
  if (score >= 2000) return 'VIP';
  if (score >= 1000) return 'Standard';
  return 'High Risk';
}

/**
 * Get fee color based on score (for UI)
 */
export function getFeeColor(score: number): string {
  if (score >= 2000) return 'neonGreen';
  if (score >= 1000) return 'blue';
  return 'warningOrange';
}

/**
 * Convert fee percentage to basis points for smart contract
 */
export function feePercentageToBasisPoints(feePercent: number): number {
  return Math.floor(feePercent * 100);
}

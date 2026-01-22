/**
 * Token utilities for resolving token names and symbols
 */

// Common token addresses on Base Sepolia (and some mainnet addresses for demonstration)
const KNOWN_TOKENS: Record<string, { symbol: string; name: string; decimals: number }> = {
  // Base Sepolia tokens
  '0x4200000000000000000000000000000000000006': { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
  '0x036CbD53842c5426634e7929541eC2318f3dCF7e': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  // Common test tokens
  '0x0000000000000000000000000000000000000000': { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
};

// ERC20 ABI for reading token metadata
export const ERC20_ABI = [
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Cache for fetched token metadata
const tokenCache: Record<string, { symbol: string; name: string; decimals: number } | null> = {};

/**
 * Get known token info from our hardcoded list
 */
export function getKnownToken(address: string): { symbol: string; name: string; decimals: number } | null {
  const normalizedAddress = address.toLowerCase();
  for (const [knownAddress, info] of Object.entries(KNOWN_TOKENS)) {
    if (knownAddress.toLowerCase() === normalizedAddress) {
      return info;
    }
  }
  return null;
}

/**
 * Format token address for display (truncated)
 */
export function formatTokenAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get cached token info
 */
export function getCachedTokenInfo(address: string): { symbol: string; name: string; decimals: number } | null {
  const normalizedAddress = address.toLowerCase();

  // First check known tokens
  const known = getKnownToken(address);
  if (known) return known;

  // Then check cache
  return tokenCache[normalizedAddress] || null;
}

/**
 * Cache token info after fetching
 */
export function cacheTokenInfo(address: string, info: { symbol: string; name: string; decimals: number }): void {
  tokenCache[address.toLowerCase()] = info;
}

/**
 * Get display name for a token (symbol or truncated address)
 */
export function getTokenDisplayName(address: string, fetchedSymbol?: string): string {
  // Check known tokens first
  const known = getKnownToken(address);
  if (known) return known.symbol;

  // Use fetched symbol if available
  if (fetchedSymbol) return fetchedSymbol;

  // Check cache
  const cached = getCachedTokenInfo(address);
  if (cached) return cached.symbol;

  // Fallback to truncated address
  return formatTokenAddress(address);
}

import { normalize } from 'viem/ens';

/**
 * Fetch ENS avatar for a given Ethereum address
 * Falls back to DiceBear avatar if no ENS avatar found
 */
export async function fetchEnsAvatar(address: string): Promise<string> {
  try {
    // Try to fetch from ENS
    const ensName = await getEnsName(address);
    if (ensName) {
      const avatarUrl = await getEnsAvatarUrl(ensName);
      if (avatarUrl) return avatarUrl;
    }
  } catch (error) {
    console.debug('ENS avatar fetch failed:', error);
  }

  // Fallback to DiceBear avatar (deterministic based on address)
  return getDiceBearAvatar(address);
}

/**
 * Get ENS name for an address using public ENS resolver
 */
async function getEnsName(address: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.ensdata.net/ens/resolve/${address}`
    );
    if (response.ok) {
      const data = await response.json();
      return data.name || null;
    }
  } catch (error) {
    console.debug('ENS name lookup failed:', error);
  }
  return null;
}

/**
 * Get avatar URL from ENS name using public resolver
 */
async function getEnsAvatarUrl(ensName: string): Promise<string | null> {
  try {
    const normalized = normalize(ensName);
    const response = await fetch(
      `https://api.ensdata.net/avatar/${normalized}`
    );
    if (response.ok) {
      const data = await response.json();
      return data.avatar || null;
    }
  } catch (error) {
    console.debug('ENS avatar URL fetch failed:', error);
  }
  return null;
}

/**
 * Generate deterministic DiceBear avatar URL from address
 * These are unique per address and look nice
 */
function getDiceBearAvatar(address: string): string {
  // Use the address as seed for consistent avatars
  const seed = address.toLowerCase().slice(2);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
}

/**
 * Get ENS name display for an address
 */
export async function fetchEnsName(address: string): Promise<string | null> {
  return getEnsName(address);
}

/**
 * Get short address format with fallback to ENS name
 */
export function formatAddressShort(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

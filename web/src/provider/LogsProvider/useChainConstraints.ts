import { useCallback } from 'react';
import type { PublicClient } from 'viem';

export const useChainConstraints = (client: PublicClient | null) => {
  const detectConstraints = useCallback(async (client: PublicClient) => {
    if (!client) return null;
    
    const currentBlock = await client.getBlockNumber();
    let left = 0n;
    let right = currentBlock;
    let oldestAccessible = currentBlock;

    while (left <= right) {
      const mid = left + (right - left) / 2n;
      try {
        await client.getBlock({ blockNumber: mid });
        oldestAccessible = mid;
        right = mid - 1n;
      } catch (error) {
        left = mid + 1n;
      }
    }

    return {
      maxBlockRange: 100000, // Default, can be adjusted based on chain
      oldestAccessibleBlock: oldestAccessible
    };
  }, []);

  return { detectConstraints };
};

import {type BlockRange} from './types';
import { base	} from '@/assets/HashChan2.json';

export const CHAIN_CONFIGS = {
  // Base
  8453: {
    rpcType: 'public' as const,
    maxBlockRange: 99999,
    // Base mainnet launch block
    oldestKnownBlock: base.firstBlock,
  },
  // Ethereum
  1: {
    rpcType: 'archive' as const,
    maxBlockRange: Infinity,
    // Could be contract deployment block
    oldestKnownBlock: 0, 
  },
  // Optimism
  10: {
    rpcType: 'public' as const,
    maxBlockRange: 120000,
    oldestKnownBlock: 0,
  },
  // Arbitrum
  42161: {
    rpcType: 'public' as const,
    maxBlockRange: 100000,
    oldestKnownBlock: 0,
  }
} as const;


export const mergeRanges = (ranges: BlockRange[]): BlockRange[] => {
  if (ranges.length <= 1) return ranges;

  const sorted = [...ranges].sort((a, b) => a.fromBlock - b.fromBlock);
  return sorted.reduce((merged: BlockRange[], current) => {
    const last = merged[merged.length - 1];
    
    if (!last || current.fromBlock > last.toBlock + 1) {
      merged.push(current);
    } else {
      last.toBlock = Math.max(last.toBlock, current.toBlock);
      last.synced = last.synced && current.synced;
      last.lastAttempt = Math.max(last.lastAttempt, current.lastAttempt);
    }
    
    return merged;
  }, []);
};

export const calculateBlockRanges = (fromBlock: bigint, toBlock: bigint, maxRange: number): Array<{fromBlock: bigint, toBlock: bigint}> => {
  const ranges = [];
  let currentFrom = fromBlock;
  
  while (currentFrom <= toBlock) {
    const rangeEnd = currentFrom + BigInt(maxRange);
    const currentTo = rangeEnd > toBlock ? toBlock : rangeEnd;
    ranges.push({ fromBlock: currentFrom, toBlock: currentTo });
    currentFrom = currentTo + 1n;
  }
  
  return ranges;
};


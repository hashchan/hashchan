import { useCallback } from 'react';
import type { PublicClient } from 'viem';
import type { HashchanDB } from './types';
import { useChainConstraints } from './useChainConstraints';
import { mergeRanges, calculateBlockRanges } from './utils'
export const useLogFetching = (client: PublicClient | null, db: HashchanDB | null) => {
  const { detectConstraints } = useChainConstraints(client);
  
  const fetchLogsForRange = useCallback(async (
    client: PublicClient,
    params: {
      address: `0x${string}`,
      fromBlock: bigint,
      toBlock: bigint,
      eventName: string,
      args?: Record<string, any>,
      abi: any
    },
    retries = 3
  ) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const filter = await client.createContractEventFilter(params);
        return await client.getFilterLogs({ filter });
      } catch (error) {
        if (attempt === retries - 1) throw error;
        if (error.message?.includes('block range is too large')) {
          params.toBlock = params.fromBlock + (params.toBlock - params.fromBlock) / 2n;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return [];
  }, []);

  const fetchLogs = useCallback(async (params: {
    chainId: number,
    address: `0x${string}`,
    fromBlock: number,
    toBlock: number,
    eventName: string,
    args?: Record<string, any>,
    abi: any,
    client: PublicClient
  }) => {
    if (!db || !params.client) throw new Error('Database or client not initialized');

    // Get or initialize chain sync state
    let chainSync = await db.chainSync.get(params.chainId);
    if (!chainSync) {
      const constraints = await detectConstraints(params.client);
      chainSync = {
        chainId: params.chainId,
        ranges: [],
        oldestAccessibleBlock: Number(constraints.oldestAccessibleBlock),
        maxBlockRange: constraints.maxBlockRange,
        lastUpdated: Date.now()
      };
      await db.chainSync.add(chainSync);
    }

    // Calculate and merge ranges
    const newRange = {
      fromBlock: params.fromBlock,
      toBlock: params.toBlock,
      synced: false,
      lastAttempt: Date.now()
    };

    const updatedRanges = mergeRanges([...chainSync.ranges, newRange]);
    const unsynced = updatedRanges.filter(range => !range.synced);

    // Fetch logs for unsynced ranges
    const allLogs = [];
    for (const range of unsynced) {
      try {
        const blockRanges = calculateBlockRanges(
          BigInt(range.fromBlock),
          BigInt(range.toBlock),
          chainSync.maxBlockRange
        );

        for (const { fromBlock, toBlock } of blockRanges) {
          const logs = await fetchLogsForRange(params.client, {
            ...params,
            fromBlock,
            toBlock
          });
          allLogs.push(...logs);
        }

        range.synced = true;
        range.lastAttempt = Date.now();
      } catch (error) {
        console.error(`Failed to fetch logs for range ${range.fromBlock}-${range.toBlock}:`, error);
        range.lastAttempt = Date.now();
      }
    }

    // Update chain sync state
    await db.chainSync.put({
      ...chainSync,
      ranges: updatedRanges,
      lastUpdated: Date.now()
    });

    return allLogs;
  }, [db, fetchLogsForRange, detectConstraints]);

  return { fetchLogs };
};


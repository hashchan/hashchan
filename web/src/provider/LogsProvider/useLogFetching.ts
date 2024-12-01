import { useCallback } from 'react';
import type { PublicClient } from 'viem';
import type { HashchanDB } from './types';
import { mergeRanges, calculateBlockRanges, CHAIN_CONFIGS } from './utils'
import { BlockRange } from './types';

export const useLogFetching = (client: PublicClient | null, db: HashchanDB | null) => {
  
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
    console.log(`Fetching logs for range ${params.fromBlock}-${params.toBlock}`);
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const filter = await client.createContractEventFilter(params);
        const logs = await client.getFilterLogs({ filter });
        console.log(`Successfully fetched ${logs.length} logs for range ${params.fromBlock}-${params.toBlock}`);
        return logs;
      } catch (error: any) {
        if (attempt === retries - 1) throw error;
        
        // Handle different RPC error cases
        if (error.message?.includes('block range is too large')) {
          const midPoint = params.fromBlock + (params.toBlock - params.fromBlock) / 2n;
          console.log(`Block range too large, reducing to ${params.fromBlock}-${midPoint}`);
          params.toBlock = midPoint;
        } else if (error.code === -32005 || error.message?.includes('rate limit')) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(`Rate limited, waiting ${delay}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.warn(`Error fetching logs (attempt ${attempt + 1}/${retries}):`, error);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    return [];
  }, []);

  const fetchLogs = useCallback(async ({
    chainId,
    address,
    fromBlock,
    toBlock,
    eventName,
    args,
    abi,
    client
  }:{
    chainId: number,
    address: `0x${string}`,
    fromBlock: number,
    toBlock: number,
    eventName: string,
    args?: Record<string, any>,
    abi: any,
    client: PublicClient
  }) => {
    if (!db || !client) throw new Error('Database or client not initialized');

    // Get chain configuration
    const chainConfig = CHAIN_CONFIGS[chainId as keyof typeof CHAIN_CONFIGS];
    console.log('chainConfig', chainConfig);
    if (!chainConfig) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    // Get or initialize chain sync state
    let chainSync = await db.chainSync.get(chainId);
    if (!chainSync) {
      console.log('New chain detected, initializing sync state');
      chainSync = {
        chainId,
        rpcType: chainConfig.rpcType,
        ranges: [],
        oldestAccessibleBlock: chainConfig.oldestKnownBlock,
        maxBlockRange: chainConfig.maxBlockRange,
        lastSyncedBlock: 0
      };
      await db.chainSync.add(chainSync);
    }

    // Check if the block range is large enough to warrant an RPC call
    const blockDifference = toBlock - fromBlock;
    if (blockDifference < chainConfig.maxBlockRange) {
      console.log(`Block range (${blockDifference}) is smaller than maxBlockRange (${chainConfig.maxBlockRange}), skipping fetch`);
      return [];
    }

    // Validate block range
    if (fromBlock < chainSync.oldestAccessibleBlock) {
      console.warn(`Requested fromBlock ${fromBlock} is before oldest accessible block ${chainSync.oldestAccessibleBlock}`);
      fromBlock = chainSync.oldestAccessibleBlock;
    }

    // Ensure we're not requesting empty or invalid ranges
    if (fromBlock > toBlock) {
      console.warn('Invalid block range requested: fromBlock > toBlock');
      return [];
    }

    // First, calculate the optimal block ranges based on chain config
    const initialRanges = calculateBlockRanges(
      BigInt(fromBlock),
      BigInt(toBlock),
      chainConfig.maxBlockRange
    );

    console.log(`Initial range split into ${initialRanges.length} chunks`);

    // Convert these ranges to our BlockRange type and mark as unsynced
    const newRanges: BlockRange[] = initialRanges.map(range => ({
      fromBlock: Number(range.fromBlock),
      toBlock: Number(range.toBlock),
      synced: false,
      lastAttempt: Date.now()
    }));

    // Merge with existing ranges
    const updatedRanges = mergeRanges([...chainSync.ranges, ...newRanges]);
    const unsynced = updatedRanges.filter(range => !range.synced);

    // Fetch logs for unsynced ranges
    const allLogs = [];
    const failedRanges: BlockRange[] = [];

    for (const range of unsynced) {
      try {
        const logs = await fetchLogsForRange(client, {
          address,
          fromBlock: BigInt(range.fromBlock),
          toBlock: BigInt(range.toBlock),
          eventName,
          args,
          abi
        });
        allLogs.push(...logs);
        range.synced = true;
        range.lastAttempt = Date.now();
      } catch (error) {
        console.error(`Failed to fetch logs for range ${range.fromBlock}-${range.toBlock}:`, error);
        range.lastAttempt = Date.now();
        failedRanges.push(range);
      }
    }

    // Update chain sync state
    const finalRanges = updatedRanges.map(range => {
      const failed = failedRanges.find(f => f.fromBlock === range.fromBlock && f.toBlock === range.toBlock);
      return failed || range;
    });

    await db.chainSync.put({
      ...chainSync,
      ranges: finalRanges,
      lastSyncedBlock: Math.max(
        chainSync.lastSyncedBlock,
        ...finalRanges.filter(r => r.synced).map(r => r.toBlock)
      )
    });

    return allLogs;
  }, [db, fetchLogsForRange]);

  return { fetchLogs };
};

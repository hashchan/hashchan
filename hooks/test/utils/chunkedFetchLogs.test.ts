import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePublicClient } from 'wagmi'
import { useCreateBoard } from '../../src/hooks/useCreateBoard'
import { chunkedFetchLogs } from '../../src/utils/blockchain'
import HashChan3 from '../../src/abi/HashChan3.json'
import { createTestWrapper } from '../utils/wrapper'
import { createRpcCall, mineBlocks } from '../utils/rpc'

const CHAIN_ID = parseInt(process.env.TEST_CHAIN_ID ?? '31337')
const MAX_RANGE = 5

const createTestBoard = async (name: string, symbol: string) => {
  const wrapper = createTestWrapper()
  const { result, unmount } = renderHook(() => useCreateBoard(), { wrapper })
  await vi.waitUntil(async () => {
    if (result.current.status === 'idle') {
      await result.current.createBoard(name, symbol, `${name} description`, '', [])
    }
    return result.current.status === 'confirmed'
  }, { timeout: 15_000, interval: 1_000 })
  const boardId = Number(result.current.logs[0].args.boardId)
  unmount()
  return boardId
}

// This is the direct regression test for the bug that drove this whole
// migration: a real RPC provider (e.g. Infura's free tier) rejects
// eth_newFilter/eth_getLogs calls whose block range is too wide. Two boards
// created many blocks apart, read back through a wrapper simulating exactly
// that limit, must still both be found — chunkedFetchLogs is what makes that
// possible without tryRecurseBlockFilter's blind-retry-toward-the-tip stopgap
// (which would have silently missed the older one).
describe('chunkedFetchLogs', () => {
  it('finds logs spanning a wider range than the RPC allows per call, by chunking', async () => {
    const rpcCall = createRpcCall(process.env.TEST_RPC_URL!)

    const firstBoardId = await createTestBoard('Chunk Test A', 'CKA')
    await mineBlocks(MAX_RANGE * 3, rpcCall)
    const secondBoardId = await createTestBoard('Chunk Test B', 'CKB')

    const wrapper = createTestWrapper({ maxBlockRange: MAX_RANGE })
    const { result: clientResult, unmount } = renderHook(() => usePublicClient(), { wrapper })
    await vi.waitUntil(() => !!clientResult.current, { timeout: 10_000 })
    const publicClient = clientResult.current!

    const toBlock = await publicClient.getBlockNumber()
    const hc3Address = (HashChan3 as any)[String(CHAIN_ID)].address as `0x${string}`

    const logs = await chunkedFetchLogs(publicClient, {
      address: hc3Address,
      abi: HashChan3.abi,
      eventName: 'NewBoard',
      fromBlock: 0n,
      toBlock,
    }, BigInt(MAX_RANGE))

    const boardIds = logs.map((l: any) => Number(l.args.boardId))
    expect(boardIds).toContain(firstBoardId)
    expect(boardIds).toContain(secondBoardId)

    unmount()
  })

  it('a single unchunked call over the same range fails against the range-limited RPC', async () => {
    const wrapper = createTestWrapper({ maxBlockRange: MAX_RANGE })
    const { result: clientResult, unmount } = renderHook(() => usePublicClient(), { wrapper })
    await vi.waitUntil(() => !!clientResult.current, { timeout: 10_000 })
    const publicClient = clientResult.current!

    const toBlock = await publicClient.getBlockNumber()
    const hc3Address = (HashChan3 as any)[String(CHAIN_ID)].address as `0x${string}`

    // Only meaningful if the chain has grown past MAX_RANGE blocks already
    // (true by this point in the suite thanks to the previous test).
    await expect(
      publicClient.createContractEventFilter({
        address: hc3Address,
        abi: HashChan3.abi,
        eventName: 'NewBoard',
        fromBlock: 0n,
        toBlock,
      })
    ).rejects.toThrow()

    unmount()
  })
})

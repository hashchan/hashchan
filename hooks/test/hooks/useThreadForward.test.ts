import { useContext } from 'react'
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useHookSettings } from '../../src/hooks/useHookSettings'
import { useCreateBoard } from '../../src/hooks/useCreateBoard'
import { useCreateThread } from '../../src/hooks/useCreateThread'
import { useThread } from '../../src/hooks/useThread'
import { IDBContext } from '../../src/provider/IDBProvider'
import { createTestWrapper } from '../utils/wrapper'
import { createRpcCall, mineBlocks } from '../utils/rpc'

let BOARD_ID: number
let THREAD_ID: string
let THREAD_BLOCK_CREATED_AT: bigint
let THREAD_ID_2: string
let THREAD_BLOCK_CREATED_AT_2: bigint
const CHAIN_ID = parseInt(process.env.TEST_CHAIN_ID ?? '31337')
const BLOCK_RANGE = 5

// Creates a thread, captures its blockCreatedAt, then deletes the local
// cache entry so it can only be found the way a cold recipient of a shared
// link would: via useThread's own bootstrap lookup, not from a warm cache.
const createColdThread = async (boardId: number, title: string) => {
  let threadId: string
  {
    const wrapper = createTestWrapper()
    const { result, unmount } = renderHook(() => useCreateThread(boardId, CHAIN_ID), { wrapper })
    await vi.waitUntil(async () => {
      if (!result.current.hash) {
        await result.current.createThread(title, '', `content for ${title}`)
      }
      return !!result.current.hash
    }, { timeout: 15_000, interval: 1_000 })
    await vi.waitUntil(() => !!result.current.threadId, { timeout: 15_000 })
    threadId = result.current.threadId!
    await new Promise(r => setTimeout(r, 400))
    unmount()
  }

  const wrapper = createTestWrapper()
  const { result, unmount } = renderHook(() => useContext(IDBContext), { wrapper })
  await vi.waitUntil(() => !!result.current.db, { timeout: 10_000 })
  const cached = await result.current.db!.threads.where('threadId').equals(threadId).first()
  const blockCreatedAt = BigInt(cached!.blockCreatedAt!)
  await result.current.db!.threads.where('threadId').equals(threadId).delete()
  unmount()

  return { threadId, blockCreatedAt }
}

describe('useThread atBlock / forward scan', () => {
  beforeAll(async () => {
    const rpcCall = createRpcCall(process.env.TEST_RPC_URL!)

    // Switch to reverseChunked with a small block range so we can mine well
    // past it cheaply — same setup as useThreadsHistory.test.ts.
    {
      const wrapper = createTestWrapper()
      const { result, unmount } = renderHook(() => useHookSettings(), { wrapper })
      await vi.waitUntil(() => result.current.hookSettings !== null, { timeout: 10_000 })
      await result.current.updateHookSettings({ indexingStrategy: 'reverseChunked', blockRangeLimit: BLOCK_RANGE })
      await new Promise(r => setTimeout(r, 400))
      unmount()
    }

    // Fresh board so this file's spans aren't affected by state other test
    // files left on shared board ids (this suite runs single-forked, sharing
    // one IndexedDB across files).
    {
      const wrapper = createTestWrapper()
      const { result, unmount } = renderHook(() => useCreateBoard(), { wrapper })
      await vi.waitUntil(async () => {
        if (result.current.status === 'idle') {
          await result.current.createBoard('Forward Scan Test Board', 'FWD', 'for atBlock forward-scan tests', '', [])
        }
        return result.current.status === 'confirmed'
      }, { timeout: 15_000, interval: 1_000 })
      BOARD_ID = Number(result.current.logs[0].args.boardId)
      unmount()
    }

    // Two independent cold threads: one for the crash-fix/multi-call-loop
    // tests, one for the single-call toBlockHint test — kept separate so
    // that fully merging one thread's spans (as the toBlockHint test does in
    // one shot) can't leave the other test with nothing left to scan.
    ;({ threadId: THREAD_ID, blockCreatedAt: THREAD_BLOCK_CREATED_AT } = await createColdThread(BOARD_ID, 'atBlock forward scan thread'))
    ;({ threadId: THREAD_ID_2, blockCreatedAt: THREAD_BLOCK_CREATED_AT_2 } = await createColdThread(BOARD_ID, 'atBlock toBlockHint thread'))

    // Mine well past several live windows so both threads are nowhere near
    // the tip-tailed live span, and a forward scan genuinely has multiple
    // windows to cross before merging.
    await mineBlocks(BLOCK_RANGE * 4, rpcCall)
  })

  afterAll(async () => {
    // hookSettings is global/shared IndexedDB state across every test file in
    // this single-forked suite — reset it so later files see the default
    // fullNode strategy they assume.
    const wrapper = createTestWrapper()
    const { result, unmount } = renderHook(() => useHookSettings(), { wrapper })
    await vi.waitUntil(() => result.current.hookSettings !== null, { timeout: 10_000 })
    await result.current.updateHookSettings({ indexingStrategy: 'fullNode', blockRangeLimit: 10000 })
    await new Promise(r => setTimeout(r, 400))
    unmount()
  })

  it('surfaces a thread older than the live window via atBlock instead of crashing', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useThread(BOARD_ID, CHAIN_ID, THREAD_ID, THREAD_BLOCK_CREATED_AT),
      { wrapper }
    )

    // Wait on the actual outcome, not on isLoading — a query that starts out
    // `enabled: false` reports isLoading as false too (isLoading requires
    // both pending AND fetching), so it briefly looks "done" before the
    // fetch has even started once enabled flips true.
    await vi.waitUntil(
      () => result.current.posts.some((p: any) => p.threadId === THREAD_ID),
      { timeout: 15_000 }
    )

    expect(result.current.isReducedMode).toBe(false)
  })

  it('fetchForward completes in a single call when a toBlockHint bounds the whole gap', async () => {
    const rpcCall = createRpcCall(process.env.TEST_RPC_URL!)
    const head = BigInt(parseInt(await rpcCall('eth_blockNumber') as string, 16))

    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useThread(BOARD_ID, CHAIN_ID, THREAD_ID_2, THREAD_BLOCK_CREATED_AT_2, head),
      { wrapper }
    )

    await vi.waitUntil(
      () => result.current.posts.some((p: any) => p.threadId === THREAD_ID_2),
      { timeout: 15_000 }
    )
    await vi.waitUntil(() => result.current.canFetchForward, { timeout: 15_000 })

    // A bounded toBlockHint (here, the current chain head — exactly what a
    // real "copy link" action would capture) lets one call batch up to
    // MAX_FORWARD_WINDOWS windows instead of just one, so the whole
    // BLOCK_RANGE * 4 gap this suite mined should close in a single call.
    await result.current.fetchForward()

    await vi.waitUntil(() => !result.current.canFetchForward, { timeout: 15_000 })
    expect(result.current.canFetchForward).toBe(false)
  })

  it('fetchForward walks toward the live span and canFetchForward goes false once merged', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useThread(BOARD_ID, CHAIN_ID, THREAD_ID, THREAD_BLOCK_CREATED_AT),
      { wrapper }
    )

    await vi.waitUntil(
      () => result.current.posts.some((p: any) => p.threadId === THREAD_ID),
      { timeout: 15_000 }
    )
    await vi.waitUntil(() => result.current.canFetchForward, { timeout: 15_000 })

    // Repeatedly scan forward until the atBlock-anchored span merges with the
    // live span — bounded by the number of blockRangeLimit windows we mined
    // past, so this can't loop forever if merging is broken.
    for (let i = 0; i < 20 && result.current.canFetchForward; i++) {
      await result.current.fetchForward()
      await new Promise(r => setTimeout(r, 100))
    }

    await vi.waitUntil(() => !result.current.canFetchForward, { timeout: 15_000 })
    expect(result.current.canFetchForward).toBe(false)
  })
})

import { useContext } from 'react'
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useHookSettings } from '../../src/hooks/useHookSettings'
import { useCreateBoard } from '../../src/hooks/useCreateBoard'
import { useCreateThread } from '../../src/hooks/useCreateThread'
import { useThreads } from '../../src/hooks/useThreads'
import { IDBContext } from '../../src/provider/IDBProvider'
import { createTestWrapper } from '../utils/wrapper'
import { createRpcCall, mineBlocks } from '../utils/rpc'

let BOARD_ID: number
const CHAIN_ID = parseInt(process.env.TEST_CHAIN_ID ?? '31337')
const BLOCK_RANGE = 5
const HISTORY_TITLE = 'reverseChunked history thread'

describe('useThreads reverseChunked fetchHistory', () => {
  beforeAll(async () => {
    const rpcCall = createRpcCall(process.env.TEST_RPC_URL!)

    // Switch to reverseChunked with a small block range so we can mine past it cheaply
    {
      const wrapper = createTestWrapper()
      const { result, unmount } = renderHook(() => useHookSettings(), { wrapper })
      await vi.waitUntil(() => result.current.hookSettings !== null, { timeout: 10_000 })
      await result.current.updateHookSettings({ indexingStrategy: 'reverseChunked', blockRangeLimit: BLOCK_RANGE })
      await new Promise(r => setTimeout(r, 400))
      unmount()
    }

    // Fresh board so this file's lastSynced/scanBoundary bridging isn't
    // affected by state other test files left on shared board ids (this
    // suite runs single-forked, sharing one IndexedDB across files).
    {
      const wrapper = createTestWrapper()
      const { result, unmount } = renderHook(() => useCreateBoard(), { wrapper })
      await vi.waitUntil(async () => {
        if (result.current.status === 'idle') {
          await result.current.createBoard('History Test Board', 'HIST', 'for reverseChunked history tests', '', [])
        }
        return result.current.status === 'confirmed'
      }, { timeout: 15_000, interval: 1_000 })
      BOARD_ID = Number(result.current.logs[0].args.boardId)
      unmount()
    }

    // Create the thread that will end up outside the live window
    let threadId: string
    {
      const wrapper = createTestWrapper()
      const { result, unmount } = renderHook(
        () => useCreateThread(BOARD_ID, CHAIN_ID),
        { wrapper }
      )
      await vi.waitUntil(async () => {
        if (!result.current.hash) {
          await result.current.createThread(HISTORY_TITLE, '', 'content for history test')
        }
        return !!result.current.hash
      }, { timeout: 15_000, interval: 1_000 })
      await vi.waitUntil(() => !!result.current.threadId, { timeout: 15_000 })
      threadId = result.current.threadId!
      await new Promise(r => setTimeout(r, 400))
      unmount()
    }

    // useCreateThread now persists the thread to IDB immediately on
    // confirmation (so a just-created thread is instantly visible instead of
    // waiting on a scan) — delete that local cache entry so this thread can
    // only be found the way this suite means to test: via a windowed
    // reverseChunked scan, as if from a device that never saw the creation
    // event live.
    {
      const wrapper = createTestWrapper()
      const { result, unmount } = renderHook(() => useContext(IDBContext), { wrapper })
      await vi.waitUntil(() => !!result.current.db, { timeout: 10_000 })
      await result.current.db!.threads.where('threadId').equals(threadId).delete()
      unmount()
    }

    // Mine past the live window so the thread falls outside [currentBlock - BLOCK_RANGE, currentBlock]
    await mineBlocks(BLOCK_RANGE + 1, rpcCall)
  })

  afterAll(async () => {
    // hookSettings is global/shared IndexedDB state across every test file in
    // this single-forked suite — reset it so later files see the default
    // fullNode strategy they assume, rather than this file's reverseChunked/
    // tiny-blockRangeLimit setup.
    const wrapper = createTestWrapper()
    const { result, unmount } = renderHook(() => useHookSettings(), { wrapper })
    await vi.waitUntil(() => result.current.hookSettings !== null, { timeout: 10_000 })
    await result.current.updateHookSettings({ indexingStrategy: 'fullNode', blockRangeLimit: 10000 })
    await new Promise(r => setTimeout(r, 400))
    unmount()
  })

  it('thread is not visible in the live window', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(() => useThreads(BOARD_ID, CHAIN_ID), { wrapper })

    // canFetchHistory being true means strategy=reverseChunked + blockNumber ready;
    // !isLoading means the initial live-window query has completed
    await vi.waitUntil(
      () => result.current.canFetchHistory && !result.current.isLoading,
      { timeout: 15_000 }
    )

    expect(result.current.threads.some((t: any) => t.title === HISTORY_TITLE)).toBe(false)
  })

  it('fetchHistory surfaces the thread from the historical range', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(() => useThreads(BOARD_ID, CHAIN_ID), { wrapper })

    await vi.waitUntil(
      () => result.current.canFetchHistory && !result.current.isLoading,
      { timeout: 15_000 }
    )

    await result.current.fetchHistory()

    await vi.waitUntil(
      () => result.current.threads.some((t: any) => t.title === HISTORY_TITLE),
      { timeout: 15_000 }
    )

    expect(result.current.threads.some((t: any) => t.title === HISTORY_TITLE)).toBe(true)
  })
})

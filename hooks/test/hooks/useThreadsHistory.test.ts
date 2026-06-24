import { describe, it, expect, vi, beforeAll } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSettings } from '../../src/hooks/useSettings'
import { useCreateThread } from '../../src/hooks/useCreateThread'
import { useThreads } from '../../src/hooks/useThreads'
import { createTestWrapper } from '../utils/wrapper'
import { createRpcCall, mineBlocks } from '../utils/rpc'

const BOARD_ID = 0
const CHAIN_ID = parseInt(process.env.TEST_CHAIN_ID ?? '31337')
const BLOCK_RANGE = 5
const HISTORY_TITLE = 'reverseChunked history thread'

describe('useThreads reverseChunked fetchHistory', () => {
  beforeAll(async () => {
    const rpcCall = createRpcCall(process.env.TEST_RPC_URL!)

    // Switch to reverseChunked with a small block range so we can mine past it cheaply
    {
      const wrapper = createTestWrapper()
      const { result, unmount } = renderHook(() => useSettings(), { wrapper })
      await vi.waitUntil(() => result.current.settings !== null, { timeout: 10_000 })
      await result.current.updateSettings({ indexingStrategy: 'reverseChunked', blockRangeLimit: BLOCK_RANGE })
      await new Promise(r => setTimeout(r, 400))
      unmount()
    }

    // Create the thread that will end up outside the live window
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
      await new Promise(r => setTimeout(r, 400))
      unmount()
    }

    // Mine past the live window so the thread falls outside [currentBlock - BLOCK_RANGE, currentBlock]
    await mineBlocks(BLOCK_RANGE + 1, rpcCall)
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

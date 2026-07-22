import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCreateThread } from '../../src/hooks/useCreateThread'
import { useThreads } from '../../src/hooks/useThreads'
import { createTestWrapper } from '../utils/wrapper'

// boardId 0 is pre-created by the HashChan3 constructor.
const BOARD_ID = 0
const CHAIN_ID = parseInt(process.env.TEST_CHAIN_ID ?? '31337')

describe('useCreateThread', () => {
  it('starts idle, reaches confirmed with a threadId', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useCreateThread(BOARD_ID, CHAIN_ID),
      { wrapper }
    )

    expect(result.current.status).toBe('idle')

    await vi.waitUntil(async () => {
      if (result.current.status === 'idle') {
        await result.current.createThread('Hello hashchan', '', 'first thread from tests')
      }
      return result.current.status === 'confirmed'
    }, { timeout: 15_000, interval: 1_000 })

    expect(result.current.hash).toBeTruthy()
    expect(result.current.threadId).toBeTruthy()
    expect(result.current.logErrors).toHaveLength(0)
  })

  it('emits a NewThread event log with correct args', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useCreateThread(BOARD_ID, CHAIN_ID),
      { wrapper }
    )

    await vi.waitUntil(async () => {
      if (result.current.status === 'idle') {
        await result.current.createThread('Event log test', '', 'content')
      }
      return result.current.status === 'confirmed'
    }, { timeout: 15_000, interval: 1_000 })

    expect(result.current.logs[0].args.title).toBe('Event log test')
    expect(result.current.logs[0].args.threadId).toBe(result.current.threadId)
  })

  it('persists blockCreatedAt on the created thread, already cached before any scan', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useCreateThread(BOARD_ID, CHAIN_ID),
      { wrapper }
    )

    await vi.waitUntil(async () => {
      if (result.current.status === 'idle') {
        await result.current.createThread('blockCreatedAt test', '', 'content')
      }
      return result.current.status === 'confirmed'
    }, { timeout: 15_000, interval: 1_000 })

    const threadId = result.current.threadId!
    const expectedBlock = Number(result.current.logs[0].blockNumber)

    // Renders a fresh useThreads instance — if this thread weren't already
    // persisted directly by createThread, it'd have to be (re)discovered via
    // an on-chain scan first.
    const { result: threadsResult } = renderHook(
      () => useThreads(BOARD_ID, CHAIN_ID),
      { wrapper }
    )

    await vi.waitUntil(
      () => threadsResult.current.threads.some((t: any) => t.threadId === threadId),
      { timeout: 15_000 }
    )

    const thread = threadsResult.current.threads.find((t: any) => t.threadId === threadId)
    expect(thread.blockCreatedAt).toBe(expectedBlock)
  })

  it('reset returns hook to idle', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useCreateThread(BOARD_ID, CHAIN_ID),
      { wrapper }
    )

    await vi.waitUntil(async () => {
      if (result.current.status === 'idle') {
        await result.current.createThread('Reset test', '', 'will be reset')
      }
      return result.current.status === 'confirmed'
    }, { timeout: 15_000, interval: 1_000 })

    result.current.reset()

    await vi.waitUntil(() => result.current.status === 'idle', { timeout: 1_000 })
    expect(result.current.hash).toBeNull()
    expect(result.current.threadId).toBeNull()
    expect(result.current.logs).toHaveLength(0)
    expect(result.current.logErrors).toHaveLength(0)
  })
})

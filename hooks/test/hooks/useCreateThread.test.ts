import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCreateThread } from '../../src/hooks/useCreateThread'
import { createTestWrapper } from '../utils/wrapper'

// The contract is deployed fresh per test run (globalSetup).
// boardId 0 is pre-created by the HashChan3 constructor.
const BOARD_ID = 0
const CHAIN_ID = parseInt(process.env.TEST_CHAIN_ID ?? '31337')

describe('useCreateThread', () => {
  it('creates a thread and returns a threadId', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useCreateThread(BOARD_ID, CHAIN_ID),
      { wrapper }
    )

    // Retry every second until deps are ready and the tx lands.
    // vi.waitUntil avoids act() so React state flushes naturally between polls.
    await vi.waitUntil(async () => {
      if (!result.current.hash) {
        await result.current.createThread('Hello hashchan', '', 'first thread from tests')
      }
      return !!result.current.hash
    }, { timeout: 15_000, interval: 1_000 })

    // threadId comes from the watchEvent callback — just wait, don't re-trigger.
    await vi.waitUntil(() => !!result.current.threadId, { timeout: 15_000 })
    expect(result.current.logErrors).toHaveLength(0)
  })

  it('emits a NewThread event log', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useCreateThread(BOARD_ID, CHAIN_ID),
      { wrapper }
    )

    await vi.waitUntil(async () => {
      if (!result.current.hash) {
        await result.current.createThread('Event log test', '', 'content')
      }
      return !!result.current.hash
    }, { timeout: 15_000, interval: 1_000 })

    await vi.waitUntil(() => result.current.logs.length > 0, { timeout: 15_000 })
    expect(result.current.logs[0].args.title).toBe('Event log test')
  })
})

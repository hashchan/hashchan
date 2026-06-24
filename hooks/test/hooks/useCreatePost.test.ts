import { describe, it, expect, vi, beforeAll } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCreateThread } from '../../src/hooks/useCreateThread'
import { useCreatePost } from '../../src/hooks/useCreatePost'
import { createTestWrapper } from '../utils/wrapper'

const BOARD_ID = 0
const CHAIN_ID = parseInt(process.env.TEST_CHAIN_ID ?? '31337')

describe('useCreatePost', () => {
  let threadId: `0x${string}`

  beforeAll(async () => {
    const wrapper = createTestWrapper()
    const { result, unmount } = renderHook(
      () => useCreateThread(BOARD_ID, CHAIN_ID),
      { wrapper }
    )

    await vi.waitUntil(async () => {
      if (result.current.status === 'idle') {
        await result.current.createThread('Thread for post tests', '', 'content')
      }
      return result.current.status === 'confirmed'
    }, { timeout: 15_000, interval: 1_000 })

    threadId = result.current.threadId!

    await new Promise(r => setTimeout(r, 400))
    unmount()
  })

  it('starts idle, reaches confirmed after createPost', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useCreatePost(BOARD_ID, CHAIN_ID, threadId),
      { wrapper }
    )

    expect(result.current.status).toBe('idle')

    await vi.waitUntil(async () => {
      if (result.current.status === 'idle') {
        await result.current.createPost('', 'Hello from post', [])
      }
      return result.current.status === 'confirmed'
    }, { timeout: 15_000, interval: 1_000 })

    expect(result.current.hash).toBeTruthy()
    expect(result.current.logErrors).toHaveLength(0)
  })

  it('emits a NewPost event log with correct content', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useCreatePost(BOARD_ID, CHAIN_ID, threadId),
      { wrapper }
    )

    await vi.waitUntil(async () => {
      if (result.current.status === 'idle') {
        await result.current.createPost('', 'post log test content', [])
      }
      return result.current.status === 'confirmed'
    }, { timeout: 15_000, interval: 1_000 })

    expect(result.current.logs[0].args.content).toBe('post log test content')
    expect(result.current.logs[0].args.threadId).toBe(threadId)
  })

  it('reset returns hook to idle', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useCreatePost(BOARD_ID, CHAIN_ID, threadId),
      { wrapper }
    )

    await vi.waitUntil(async () => {
      if (result.current.status === 'idle') {
        await result.current.createPost('', 'reset test post', [])
      }
      return result.current.status === 'confirmed'
    }, { timeout: 15_000, interval: 1_000 })

    result.current.reset()

    await vi.waitUntil(() => result.current.status === 'idle', { timeout: 1_000 })
    expect(result.current.hash).toBeNull()
    expect(result.current.logs).toHaveLength(0)
    expect(result.current.logErrors).toHaveLength(0)
  })
})

import { describe, it, expect, vi, beforeAll } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCreateThread } from '../../src/hooks/useCreateThread'
import { useCreatePost } from '../../src/hooks/useCreatePost'
import { createTestWrapper } from '../utils/wrapper'

const BOARD_ID = 0
const CHAIN_ID = parseInt(process.env.TEST_CHAIN_ID ?? '31337')

describe('useCreatePost', () => {
  let threadId: string

  beforeAll(async () => {
    const wrapper = createTestWrapper()
    const { result, unmount } = renderHook(
      () => useCreateThread(BOARD_ID, CHAIN_ID),
      { wrapper }
    )

    await vi.waitUntil(async () => {
      if (!result.current.hash) {
        await result.current.createThread('Thread for post tests', '', 'content')
      }
      return !!result.current.hash
    }, { timeout: 15_000, interval: 1_000 })

    await vi.waitUntil(() => !!result.current.threadId, { timeout: 15_000 })
    threadId = result.current.threadId!

    await new Promise(r => setTimeout(r, 400))
    unmount()
  })

  it('creates a post and returns a hash', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useCreatePost(BOARD_ID, CHAIN_ID, threadId),
      { wrapper }
    )

    await vi.waitUntil(async () => {
      if (!result.current.hash) {
        await result.current.createPost('', 'Hello from post', [])
      }
      return !!result.current.hash
    }, { timeout: 15_000, interval: 1_000 })
  })

  it('emits a NewPost event log with correct content', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useCreatePost(BOARD_ID, CHAIN_ID, threadId),
      { wrapper }
    )

    await vi.waitUntil(async () => {
      if (!result.current.hash) {
        await result.current.createPost('', 'post log test content', [])
      }
      return !!result.current.hash
    }, { timeout: 15_000, interval: 1_000 })

    await vi.waitUntil(() => result.current.logs.length > 0, { timeout: 15_000 })
    expect(result.current.logs[0].args.content).toBe('post log test content')
  })
})

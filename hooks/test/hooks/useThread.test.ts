import { describe, it, expect, vi, beforeAll } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCreateBoard } from '../../src/hooks/useCreateBoard'
import { useCreateThread } from '../../src/hooks/useCreateThread'
import { useCreatePost } from '../../src/hooks/useCreatePost'
import { useThread } from '../../src/hooks/useThread'
import { createTestWrapper } from '../utils/wrapper'

const CHAIN_ID = parseInt(process.env.TEST_CHAIN_ID ?? '31337')

// boardId 0 is falsy and would permanently disable the useThread enabled check,
// so we create a fresh board in beforeAll and use its id.
describe('useThread', () => {
  let boardId: number
  let threadId: string

  beforeAll(async () => {
    // Create a board (boardId 0 is falsy in the enabled guard, so we need boardId >= 1)
    {
      const wrapper = createTestWrapper()
      const { result, unmount } = renderHook(() => useCreateBoard(), { wrapper })

      await vi.waitUntil(async () => {
        if (!result.current.hash) {
          await result.current.createBoard('Thread Test Board', 'TTB', 'board for useThread tests', '', [])
        }
        return !!result.current.hash
      }, { timeout: 15_000, interval: 1_000 })

      await vi.waitUntil(() => result.current.logs.length > 0, { timeout: 15_000 })
      boardId = Number(result.current.logs[0].args.boardId)
      await new Promise(r => setTimeout(r, 400))
      unmount()
    }

    // Create a thread on that board
    {
      const wrapper = createTestWrapper()
      const { result, unmount } = renderHook(
        () => useCreateThread(boardId, CHAIN_ID),
        { wrapper }
      )

      await vi.waitUntil(async () => {
        if (!result.current.hash) {
          await result.current.createThread('Thread for useThread test', '', 'thread opening content')
        }
        return !!result.current.hash
      }, { timeout: 15_000, interval: 1_000 })

      await vi.waitUntil(() => !!result.current.threadId, { timeout: 15_000 })
      threadId = result.current.threadId!
      await new Promise(r => setTimeout(r, 400))
      unmount()
    }

    // Create a reply post on that thread
    {
      const wrapper = createTestWrapper()
      const { result, unmount } = renderHook(
        () => useCreatePost(boardId, CHAIN_ID, threadId),
        { wrapper }
      )

      await vi.waitUntil(async () => {
        if (!result.current.hash) {
          await result.current.createPost('', 'reply post content', [])
        }
        return !!result.current.hash
      }, { timeout: 15_000, interval: 1_000 })

      await new Promise(r => setTimeout(r, 400))
      unmount()
    }
  })

  it('returns the thread post plus replies', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useThread(boardId, CHAIN_ID, threadId),
      { wrapper }
    )

    // posts[0] is the thread itself, posts[1+] are replies
    await vi.waitUntil(() => result.current.posts.length >= 2, { timeout: 15_000 })
    expect(result.current.posts.length).toBeGreaterThanOrEqual(2)
  })

  it('thread post has correct content', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useThread(boardId, CHAIN_ID, threadId),
      { wrapper }
    )

    await vi.waitUntil(() => result.current.posts.length >= 2, { timeout: 15_000 })
    const threadPost = result.current.posts.find((p: any) => p.threadId === threadId)
    expect(threadPost?.content).toBe('thread opening content')
  })

  it('reply post has correct content', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useThread(boardId, CHAIN_ID, threadId),
      { wrapper }
    )

    await vi.waitUntil(
      () => result.current.posts.some((p: any) => p.content === 'reply post content'),
      { timeout: 15_000 }
    )
    expect(result.current.posts.some((p: any) => p.content === 'reply post content')).toBe(true)
  })
})

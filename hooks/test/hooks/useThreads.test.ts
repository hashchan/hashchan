import { describe, it, expect, vi, beforeAll } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCreateThread } from '../../src/hooks/useCreateThread'
import { useThreads } from '../../src/hooks/useThreads'
import { createTestWrapper } from '../utils/wrapper'

const BOARD_ID = 0
const CHAIN_ID = parseInt(process.env.TEST_CHAIN_ID ?? '31337')

const TEST_TITLES = ['Threads hook alpha', 'Threads hook beta']

describe('useThreads', () => {
  beforeAll(async () => {
    for (const title of TEST_TITLES) {
      const wrapper = createTestWrapper()
      const { result, unmount } = renderHook(
        () => useCreateThread(BOARD_ID, CHAIN_ID),
        { wrapper }
      )

      await vi.waitUntil(async () => {
        if (!result.current.hash) {
          await result.current.createThread(title, '', `content for ${title}`)
        }
        return !!result.current.hash
      }, { timeout: 15_000, interval: 1_000 })

      await new Promise(r => setTimeout(r, 400))
      unmount()
    }
  })

  it('returns threads for the board', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useThreads(BOARD_ID, CHAIN_ID),
      { wrapper }
    )

    await vi.waitUntil(() => result.current.threads.length > 0, { timeout: 15_000 })
    expect(result.current.threads.length).toBeGreaterThan(0)
  })

  it('includes the threads created in beforeAll', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useThreads(BOARD_ID, CHAIN_ID),
      { wrapper }
    )

    await vi.waitUntil(
      () => TEST_TITLES.every(t => result.current.threads.some((th: any) => th.title === t)),
      { timeout: 15_000 }
    )

    const titles = result.current.threads.map((t: any) => t.title)
    expect(titles).toContain(TEST_TITLES[0])
    expect(titles).toContain(TEST_TITLES[1])
  })

  it('captures blockCreatedAt for discovered threads', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useThreads(BOARD_ID, CHAIN_ID),
      { wrapper }
    )

    await vi.waitUntil(
      () => TEST_TITLES.every(t => result.current.threads.some((th: any) => th.title === t)),
      { timeout: 15_000 }
    )

    for (const title of TEST_TITLES) {
      const thread = result.current.threads.find((th: any) => th.title === title)
      expect(typeof thread.blockCreatedAt).toBe('number')
      expect(thread.blockCreatedAt).toBeGreaterThan(0)
    }
  })
})

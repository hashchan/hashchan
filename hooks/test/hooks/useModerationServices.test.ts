import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useModerationServices } from '../../src/hooks/useModerationServices'
import { createTestWrapper } from '../utils/wrapper'

describe('useModerationServices', () => {
  it('returns at least the pre-deployed service from the chain', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(() => useModerationServices(), { wrapper })

    await vi.waitUntil(
      () => !result.current.isLoading && result.current.moderationServices.length > 0,
      { timeout: 15_000, interval: 500 }
    )

    expect(result.current.error).toBeNull()
    const svc = result.current.moderationServices[0]
    expect(svc.name).toBe('Basic Service')
    expect(svc.uri).toBe('orbit.hashchan.org')
    expect(svc.port).toBe(443)
    expect(svc.address).toMatch(/^0x/)
    expect(svc.instance).toBeTruthy()
  })

  it('returns IDB records when a filter is passed', async () => {
    const wrapper = createTestWrapper()
    // Filter for subscribed services — none subscribed yet, so expect empty list without error.
    // status === 'success' is the reliable sentinel here: !isLoading is also true before
    // the query is even enabled, so it would return a false-positive immediately.
    const { result } = renderHook(
      () => useModerationServices({ where: { subscribed: 1 } }),
      { wrapper }
    )

    await vi.waitUntil(
      () => result.current.status === 'success',
      { timeout: 10_000, interval: 500 }
    )

    expect(result.current.error).toBeNull()
    expect(Array.isArray(result.current.moderationServices)).toBe(true)
  })
})

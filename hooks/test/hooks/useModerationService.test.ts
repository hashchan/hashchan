import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useModerationService } from '../../src/hooks/useModerationService'
import { createTestWrapper } from '../utils/wrapper'

const SERVICE_ADDRESS = process.env.MODERATION_SERVICE_ADDRESS as `0x${string}`

describe('useModerationService', () => {
  it('returns service data for the pre-deployed service', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useModerationService(SERVICE_ADDRESS),
      { wrapper }
    )

    await vi.waitUntil(
      () => result.current.status === 'success',
      { timeout: 15_000, interval: 500 }
    )

    const svc = result.current.moderationService!
    expect(svc.name).toBe('Basic Service')
    expect(svc.uri).toBe('orbit.hashchan.org')
    expect(svc.port).toBe(443)
    expect(svc.address).toBe(SERVICE_ADDRESS)
    expect(svc.instance).toBeTruthy()
  })

  it('includes the janitor added during setup', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(
      () => useModerationService(SERVICE_ADDRESS),
      { wrapper }
    )

    await vi.waitUntil(
      () => result.current.status === 'success',
      { timeout: 15_000, interval: 500 }
    )

    const janitors = result.current.moderationService!.janitors ?? []
    expect(janitors.length).toBeGreaterThan(0)
    janitors.forEach((j) => {
      expect(j.janitor).toMatch(/^0x/)
    })
  })
})

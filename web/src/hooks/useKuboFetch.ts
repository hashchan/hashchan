import { useCallback } from 'react'
import type { KuboCreds } from './useKubo'
import { detectFileType } from '@/utils/detectFileType'

// Fetches an arbitrary CID via a connected Kubo node's native /api/v0/cat
// RPC — not just CIDs it pinned itself. A real Kubo node has full TCP/QUIC/
// DHT connectivity, unlike the browser's own libp2p node (HeliaProvider.tsx,
// limited to websockets/webRTC/webTransport/circuit-relay), so it can act as
// a personal fetch fallback when the in-browser Helia node can't reach a
// given CID on the swarm (see ImageDiv.tsx's fetch-strategy comment).
const DEFAULT_FETCH_TIMEOUT_MS = 8000

export const useKuboFetch = () => {
  const fetchCID = useCallback(async (
    cidString: string,
    creds: KuboCreds,
    timeoutMs = DEFAULT_FETCH_TIMEOUT_MS
  ): Promise<{ blob: Blob | null, type: string | null }> => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(
        `${creds.endpointUrl.replace(/\/$/, '')}/api/v0/cat?arg=${encodeURIComponent(cidString)}`,
        { method: 'POST', signal: controller.signal }
      )
      if (!res.ok) return { blob: null, type: null }

      const bytes = new Uint8Array(await res.arrayBuffer())
      const type = detectFileType(bytes)
      return { blob: new Blob([bytes], { type }), type }
    } catch {
      return { blob: null, type: null }
    } finally {
      clearTimeout(timeout)
    }
  }, [])

  return { fetchCID }
}

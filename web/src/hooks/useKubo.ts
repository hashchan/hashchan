import { useCallback, useSyncExternalStore } from 'react'

// Standalone Kubo (self-hosted IPFS node) connection state, following the
// same pattern as useFilebase.ts. This is the "bring your own node" pinning
// provider — no third party involved, so it takes priority over Filebase/
// Storacha in useActivePinningProvider.
//
// Kubo's RPC API has no bearer-token auth model (unlike Filebase's/the
// formal IPFS Pinning Service API) — trust comes from CORS/network
// reachability instead, so the only thing we persist is the endpoint itself
// plus an optional gateway URL for rendering (see useKuboPin.ts).
//
// State lives in a module-level store (not per-call-site useState) so every
// component calling useKubo() re-renders when another one connects or
// disconnects, matching useFilebase.ts.

const CREDS_KEY = 'hashchan_kubo_creds'

export interface KuboCreds {
  // Kubo RPC API base, e.g. http://127.0.0.1:5001
  endpointUrl: string
  // Optional — see useKuboPin.ts. Left unset, pinned uploads are referenced
  // by bare CID and resolved by the in-browser Helia node instead.
  gatewayUrl?: string
}

const readCreds = (): KuboCreds | null => {
  try {
    const raw = localStorage.getItem(CREDS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

let cache: KuboCreds | null = readCreds()
const listeners = new Set<() => void>()

const setCache = (next: KuboCreds | null) => {
  cache = next
  listeners.forEach((listener) => listener())
}

const subscribe = (onStoreChange: () => void) => {
  listeners.add(onStoreChange)
  return () => listeners.delete(onStoreChange)
}

const getSnapshot = () => cache

export const useKubo = () => {
  const creds = useSyncExternalStore(subscribe, getSnapshot)

  const connect = useCallback((next: KuboCreds) => {
    localStorage.setItem(CREDS_KEY, JSON.stringify(next))
    setCache(next)
  }, [])

  const disconnect = useCallback(() => {
    localStorage.removeItem(CREDS_KEY)
    setCache(null)
  }, [])

  return {
    connected: !!creds,
    creds,
    connect,
    disconnect,
  }
}

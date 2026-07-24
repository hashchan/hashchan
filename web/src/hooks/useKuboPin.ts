import { useCallback } from 'react'
import type { KuboCreds } from './useKubo'

// Uploads straight to the user's own Kubo node: a single multipart POST to
// its native /api/v0/add RPC (not the formal IPFS Pinning Service API, which
// stock Kubo doesn't implement — see useKubo.ts). `?pin=true` both
// content-addresses and pins the file in one call. No Authorization header:
// Kubo's RPC API has no bearer-token concept, unlike Filebase's.
export const useKuboPin = () => {
  // react-hook-form hands back the raw FileList from the <input type="file">,
  // not a single File — unwrap it the same way useFilebasePin.ts does.
  const pinFile = useCallback(async (fileOrList: FileList | File, creds: KuboCreds): Promise<string> => {
    const file = fileOrList instanceof FileList ? fileOrList[0] : fileOrList
    const body = new FormData()
    body.append('file', file, file.name)

    const res = await fetch(`${creds.endpointUrl.replace(/\/$/, '')}/api/v0/add?pin=true`, {
      method: 'POST',
      body,
    })
    if (!res.ok) {
      throw new Error(`Kubo pin failed: ${res.status} ${await res.text()}`)
    }

    // Kubo's /api/v0/add streams one JSON object per line; a single-file
    // upload still only produces one line, but parse defensively.
    const text = await res.text()
    const lines = text.trim().split('\n').filter(Boolean)
    const { Hash } = JSON.parse(lines[lines.length - 1])

    // With no gateway configured, hand back the bare CID: ImageDiv.tsx
    // treats any non-https img value as a CID and resolves it through the
    // in-browser Helia node (useHelia.ts's fetchCID) instead of a hotlink.
    return creds.gatewayUrl
      ? `${creds.gatewayUrl.replace(/\/$/, '')}/ipfs/${Hash}`
      : Hash
  }, [])

  // Pins a CID Kubo doesn't have the bytes for yet by asking it to fetch the
  // content itself over the network — Kubo has full TCP/QUIC/DHT
  // connectivity, unlike the browser, so this is far more reliable than
  // fetching the bytes here and re-uploading them (see ImageDiv.tsx's fetch
  // strategy for the read-side version of this same asymmetry).
  const pinCID = useCallback(async (cid: string, creds: KuboCreds): Promise<void> => {
    const res = await fetch(
      `${creds.endpointUrl.replace(/\/$/, '')}/api/v0/pin/add?arg=${encodeURIComponent(cid)}`,
      { method: 'POST' }
    )
    if (!res.ok) {
      throw new Error(`Kubo pin failed: ${res.status} ${await res.text()}`)
    }
  }, [])

  return { pinFile, pinCID }
}

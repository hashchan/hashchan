import { useCallback } from 'react'
import type { FilebaseCreds } from './useFilebase'

// Uploads a file the way Storacha's uploadFile did, but straight to the
// user's own Filebase bucket: a single multipart POST to Filebase's
// Kubo-compatible IPFS RPC API (rpc.filebase.io), authenticated with the
// user's bucket-scoped token. `/api/v0/add?pin=true` both content-addresses
// and pins the file server-side in one call, so there's no need to add it to
// a local IPFS node first (and no dependency on this repo's Helia
// integration, whose remote-pinning wiring has known unresolved bugs).
export const useFilebasePin = () => {
  // react-hook-form hands back the raw FileList from the <input type="file">,
  // not a single File — unwrap it the same way Storacha's uploadFile does
  // (file[0]) so FormData gets real bytes/name/type instead of stringifying
  // the FileList object itself.
  const pinFile = useCallback(async (fileOrList: FileList | File, creds: FilebaseCreds): Promise<string> => {
    const file = fileOrList instanceof FileList ? fileOrList[0] : fileOrList
    const body = new FormData()
    body.append('file', file, file.name)

    const res = await fetch('https://rpc.filebase.io/api/v0/add?pin=true', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.token}`,
      },
      body,
    })
    if (!res.ok) {
      throw new Error(`Filebase upload failed: ${res.status} ${await res.text()}`)
    }

    // Kubo's /api/v0/add streams one JSON object per line; a single-file
    // upload still only produces one line, but parse defensively.
    const text = await res.text()
    const lines = text.trim().split('\n').filter(Boolean)
    const { Hash } = JSON.parse(lines[lines.length - 1])

    return `https://ipfs.filebase.io/ipfs/${Hash}`
  }, [])

  return { pinFile }
}

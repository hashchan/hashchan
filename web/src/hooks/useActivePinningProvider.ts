import { useW3Storage } from './useW3Storage'
import { useFilebase } from './useFilebase'
import { useFilebasePin } from './useFilebasePin'
import { useKubo } from './useKubo'
import { useKuboPin } from './useKuboPin'
import { extractCid } from '@/utils/extractCid'

const urlToFile = async (url: string): Promise<File> => {
  const res = await fetch(url)
  const blob = await res.blob()
  return new File([blob], url.split('/').pop() || 'file', { type: blob.type })
}

// Composition layer over the independent pinning-provider integrations.
// Exactly one is ever "active" — Kubo (bring your own node) takes priority
// since it needs no third party at all; Filebase is next as the maintained
// third-party path; Storacha only applies if a session from before it was
// disabled is still around. Nothing in useKubo/useKuboPin/useFilebase/
// useFilebasePin/useW3Storage depends on this file or on each other; delete
// the Storacha branch here (and the import) whenever that stack is removed.
export const useActivePinningProvider = () => {
  const { account, uploadFile } = useW3Storage()
  const { connected: filebaseConnected, creds: filebaseCreds, disconnect: disconnectFilebase } = useFilebase()
  const { pinFile: filebasePinFile, pinCID: filebasePinCID } = useFilebasePin()
  const { connected: kuboConnected, creds: kuboCreds, disconnect: disconnectKubo } = useKubo()
  const { pinFile: kuboPinFile, pinCID: kuboPinCID } = useKuboPin()

  const active: 'kubo' | 'filebase' | 'storacha' | null = kuboConnected
    ? 'kubo'
    : filebaseConnected
    ? 'filebase'
    : account?.model?.id
    ? 'storacha'
    : null

  const label = active === 'kubo'
    ? `Kubo: ${new URL(kuboCreds.endpointUrl).host}`
    : active === 'filebase'
    ? `Filebase: ${filebaseCreds?.bucket || 'connected'}`
    : active === 'storacha'
    ? `Storacha: ${account.model.id}`
    : null

  const pinFile = async (file: FileList | File): Promise<string> => {
    if (active === 'kubo') return kuboPinFile(file, kuboCreds)
    if (active === 'filebase') return filebasePinFile(file, filebaseCreds)
    if (active === 'storacha') return uploadFile(file)
    throw new Error('No pinning provider connected')
  }

  const disconnect = () => {
    if (active === 'kubo') disconnectKubo()
    if (active === 'filebase') disconnectFilebase()
    // Storacha has no logout/session-clear implemented — see useW3Storage.
  }

  // Mirrors an already-posted image (any provenance — another provider, or
  // even a plain external URL) to the viewer's own active provider. Kubo/
  // Filebase's RPC can fetch a known CID over the network itself — far more
  // reliable than pulling the bytes through the browser first — so this only
  // falls back to fetch-then-reupload when imgUrl isn't a recognizable CID
  // (extractCid.ts). Storacha isn't wired in here; it's legacy/greyed-out.
  const pinExisting = async (imgUrl: string): Promise<void> => {
    const cid = extractCid(imgUrl)
    if (active === 'kubo') {
      if (cid) return kuboPinCID(cid, kuboCreds)
      return void (await kuboPinFile(await urlToFile(imgUrl), kuboCreds))
    }
    if (active === 'filebase') {
      if (cid) return filebasePinCID(cid, filebaseCreds)
      return void (await filebasePinFile(await urlToFile(imgUrl), filebaseCreds))
    }
    throw new Error('No pinning provider connected')
  }

  return {
    active,
    label,
    canUploadImage: active !== null,
    pinFile,
    pinExisting,
    disconnect,
  }
}

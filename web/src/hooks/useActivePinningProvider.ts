import { useW3Storage } from './useW3Storage'
import { useFilebase } from './useFilebase'
import { useFilebasePin } from './useFilebasePin'

// Composition layer over the two independent pinning-provider integrations.
// Exactly one is ever "active" — Filebase takes priority since it's the
// maintained path; Storacha only applies if a session from before it was
// disabled is still around. Nothing in useFilebase/useFilebasePin/
// useW3Storage depends on this file or on each other; delete the Storacha
// branch here (and the import) whenever that stack is removed.
export const useActivePinningProvider = () => {
  const { account, uploadFile } = useW3Storage()
  const { connected: filebaseConnected, creds: filebaseCreds, disconnect: disconnectFilebase } = useFilebase()
  const { pinFile: filebasePinFile } = useFilebasePin()

  const active: 'filebase' | 'storacha' | null = filebaseConnected
    ? 'filebase'
    : account?.model?.id
    ? 'storacha'
    : null

  const label = active === 'filebase'
    ? `Filebase: ${filebaseCreds?.bucket || 'connected'}`
    : active === 'storacha'
    ? `Storacha: ${account.model.id}`
    : null

  const pinFile = async (file: FileList | File): Promise<string> => {
    if (active === 'filebase') return filebasePinFile(file, filebaseCreds)
    if (active === 'storacha') return uploadFile(file)
    throw new Error('No pinning provider connected')
  }

  const disconnect = () => {
    if (active === 'filebase') disconnectFilebase()
    // Storacha has no logout/session-clear implemented — see useW3Storage.
  }

  return {
    active,
    label,
    canUploadImage: active !== null,
    pinFile,
    disconnect,
  }
}

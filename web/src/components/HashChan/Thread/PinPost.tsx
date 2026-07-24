import { useState } from 'react'
import { FaThumbtack } from 'react-icons/fa6'
import { useActivePinningProvider } from '@/hooks/useActivePinningProvider'

// Only shown when the viewer has a writable pinning provider connected
// (Kubo or Filebase — Storacha is legacy/greyed-out, see
// useActivePinningProvider.ts). Lets any viewer mirror a post's image to
// their own provider, independent of who originally posted/pinned it.
export const PinPost = ({ imgUrl }: { imgUrl: string }) => {
  const { active, pinExisting } = useActivePinningProvider()
  const [status, setStatus] = useState<'idle' | 'pinning' | 'done' | 'error'>('idle')
  const [hovered, setHovered] = useState(false)

  if (!imgUrl || (active !== 'kubo' && active !== 'filebase')) return null

  const handlePin = async () => {
    if (status === 'pinning') return
    setStatus('pinning')
    try {
      await pinExisting(imgUrl)
      setStatus('done')
    } catch (e) {
      console.error('Pin failed', e)
      setStatus('error')
    } finally {
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  const color = status === 'done' ? '#20c20E' : status === 'error' ? '#ff0000' : hovered ? '#20c20E' : 'white'
  const title = status === 'done' ? 'Pinned!' : status === 'error' ? 'Pin failed' : status === 'pinning' ? 'Pinning...' : `Pin this image to your ${active} node`

  return (
    <>
      <span
        onClick={handlePin}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={title}
        style={{
          color,
          cursor: status === 'pinning' ? 'wait' : 'pointer',
        }}
      >
        <FaThumbtack />
      </span>&nbsp;
    </>
  )
}

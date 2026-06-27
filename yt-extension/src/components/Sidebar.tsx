import { useState, useEffect } from 'react'
import { VideoThread } from './VideoThread'
import { ConnectButton } from './ConnectButton'
import { useVideoId } from '../hooks/useVideoId'
import logoLoop from '../assets/logo-gaussian-blur.gif'
import logoOnce from '../assets/logo-gaussian-blur-no-repeat.gif'

const Logo = () => {
  const [src, setSrc] = useState(logoOnce)
  return (
    <img
      src={src}
      onMouseEnter={() => setSrc(logoLoop)}
      onMouseLeave={() => setSrc(logoOnce)}
      style={{ height: '32px', display: 'block' }}
    />
  )
}

const sidebarWidth = () => Math.max(377, Math.round(window.innerHeight / (Math.PHI ** 2)))

export const Sidebar = () => {
  const [open, setOpen] = useState(false)
  const [width, setWidth] = useState(sidebarWidth)
  const videoId = useVideoId()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'h') setOpen(v => !v)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const onResize = () => setWidth(sidebarWidth())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          pointerEvents: 'all',
          position: 'fixed',
          right: open ? `${width}px` : '0',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2147483647,
          writingMode: 'vertical-rl',
          background: '#090909',
          border: '1px solid #20C20E',
          borderRight: open ? 'none' : '1px solid #20C20E',
          color: '#20C20E',
          padding: '10px 5px',
          cursor: 'pointer',
          fontSize: '11px',
          letterSpacing: '2px',
          transition: 'right 0.2s ease',
          userSelect: 'none',
          fontFamily: 'Monospace, monospace',
        }}
      >
        {open ? 'CLOSE ◀' : 'HASHCHAN ▶'}
      </div>

      <div style={{
        pointerEvents: open ? 'all' : 'none',
        position: 'fixed',
        right: open ? '0' : `-${width}px`,
        top: '0',
        width: `${width}px`,
        height: '100vh',
        background: '#090909',
        borderLeft: '1px solid #20C20E',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 2147483646,
        transition: 'right 0.2s ease',
      }}>
        <div style={{
          padding: '8px 10px',
          borderBottom: '1px solid #20C20E',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <Logo />
          <ConnectButton />
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px',
        }}>
          {videoId ? (
            <VideoThread videoId={videoId} />
          ) : (
            <p style={{ color: '#fff', fontSize: '0.85em' }}>
              Navigate to a YouTube video to see its discussion.
            </p>
          )}
        </div>
      </div>
    </>
  )
}

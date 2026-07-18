import { useState, useEffect, useRef } from 'react'
import { FaHouse, FaMessage, FaGear } from 'react-icons/fa6'
import { PageThread } from './PageThread'
import { Catalogue } from './Catalogue'
import { Settings } from './Settings'
import { ConnectButton } from './ConnectButton'
import { useSiteContext } from '../hooks/useSiteContext'
import logoLoop from '../assets/logo-gaussian-blur.gif'
import logoOnce from '../assets/logo-gaussian-blur-no-repeat.gif'

type Tab = 'home' | 'thread' | 'settings'

const Logo = () => {
  const [src, setSrc] = useState(logoOnce)
  return (
    <img
      src={src}
      onMouseEnter={() => setSrc(logoLoop)}
      onMouseLeave={() => setSrc(logoOnce)}
      style={{ height: '34px', display: 'block' }}
    />
  )
}

const WIDTH_KEY = 'hashchan-width'
const MIN_WIDTH = 377
const maxWidth = () => Math.round(window.innerWidth * 0.854)
const clampWidth = (w: number) => Math.min(Math.max(w, MIN_WIDTH), maxWidth())

const sidebarWidth = () => {
  const stored = Number(localStorage.getItem(WIDTH_KEY))
  if (stored) return clampWidth(stored)
  return Math.max(377, Math.round(window.innerHeight / (Math.PHI ** 2)))
}

const NAV_TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
  { id: 'home',     icon: <FaHouse />,   label: 'Home' },
  { id: 'thread',   icon: <FaMessage />, label: 'Thread' },
  { id: 'settings', icon: <FaGear />,    label: 'Settings' },
]

export const Sidebar = () => {
  const [open, setOpen] = useState(() => localStorage.getItem('hashchan-open') === 'true')
  const [width, setWidth] = useState(sidebarWidth)
  const [isDragging, setIsDragging] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('thread')
  const ctx = useSiteContext()
  const containerRef = useRef<HTMLDivElement>(null)
  const tabRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef({ x: 0, width: 0 })
  const φ = Math.PHI

  // Close sidebar and suppress toggle tab when navigating away from a supported page
  useEffect(() => {
    if (!ctx) setOpen(false)
  }, [ctx])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!ctx) return
      if (e.altKey && e.key === 'h') setOpen(v => { localStorage.setItem('hashchan-open', String(!v)); return !v })
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [ctx])

  useEffect(() => {
    // Re-clamp (don't reset) on viewport resize, so a smaller window doesn't
    // clip the panel but a user-dragged width otherwise survives resizes.
    const onResize = () => setWidth(w => clampWidth(w))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const toggle = () => setOpen(v => { localStorage.setItem('hashchan-open', String(!v)); return !v })

  // Native window-level listeners (attached imperatively at mousedown, not
  // through a conditionally-rendered overlay) so dragging keeps tracking even
  // if the cursor outruns the tiny handle strip before React re-renders -
  // a rendered overlay would only start capturing moves a frame late, which
  // is exactly why the drag used to appear to "lock" as soon as the mouse
  // moved off the 5px strip.
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    dragStartRef.current = { x: e.clientX, width }
    setIsDragging(true)

    const onMove = (ev: MouseEvent) => {
      const next = clampWidth(dragStartRef.current.width + (dragStartRef.current.x - ev.clientX))
      // Mutate the DOM directly during the drag (skipping a React re-render
      // of the whole sidebar subtree on every pixel of movement); state is
      // only committed - and persisted - once, on mouseup.
      if (containerRef.current) containerRef.current.style.width = `${next}px`
      // Keep the reopen tab (positioned via the `width` state elsewhere) flush
      // with the panel's live-dragged edge instead of lagging until mouseup.
      if (tabRef.current) tabRef.current.style.right = `${next}px`
    }

    const onUp = (ev: MouseEvent) => {
      const next = clampWidth(dragStartRef.current.width + (dragStartRef.current.x - ev.clientX))
      setWidth(next)
      localStorage.setItem(WIDTH_KEY, String(next))
      setIsDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <>
      {ctx && (
        <div
          ref={tabRef}
          onClick={toggle}
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
            padding: '13px 8px',
            cursor: 'pointer',
            fontSize: '13px',
            letterSpacing: '2px',
            transition: isDragging ? 'none' : 'right 0.2618s ease',
            userSelect: 'none',
            fontFamily: 'Monospace, monospace',
          }}
        >
          {open ? 'CLOSE ◀' : 'HASHCHAN ▶'}
        </div>
      )}

      <div
        ref={containerRef}
        style={{
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
          transition: isDragging ? 'none' : 'right 0.2618s ease',
        }}>
        {open && (
          <div
            onMouseDown={handleDragStart}
            title="Drag to resize"
            style={{
              position: 'absolute',
              left: '-3px',
              top: 0,
              bottom: 0,
              width: '5px',
              cursor: 'ew-resize',
              pointerEvents: 'all',
            }}
          />
        )}
        {/* top bar */}
        <div style={{
          padding: '8px 13px',
          borderBottom: '1px solid #20C20E',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <Logo />
          <ConnectButton />
        </div>

        {/* content area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '13px' }}>
          {activeTab === 'home' && (
            <Catalogue ctx={ctx} />
          )}
          {activeTab === 'thread' && (
            ctx
              ? <PageThread ctx={ctx} />
              : <p style={{ color: '#fff', fontSize: '0.854em' }}>Navigate to a supported page to see its thread.</p>
          )}
          {activeTab === 'settings' && (
            <Settings onSave={() => setActiveTab('thread')} />
          )}
        </div>

        {/* bottom nav */}
        <div style={{
          display: 'flex',
          borderTop: '1px solid #20C20E',
          flexShrink: 0,
        }}>
          {NAV_TABS.map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                flex: 1,
                margin: 0,
                padding: `${1 / φ ** 2}em`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                fontSize: '0.7em',
                color: activeTab === id ? '#20C20E' : '#fff',
                borderColor: 'transparent',
                borderTop: activeTab === id ? '2px solid #20C20E' : '2px solid transparent',
                borderRadius: 0,
                background: activeTab === id ? '#20C20E10' : 'transparent',
              }}
            >
              <span style={{ fontSize: '1.618em' }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
      {isDragging && (
        // Passive shield: keeps the cursor pinned to ew-resize and blocks stray
        // clicks/hovers on the host page while dragging. The actual resize logic
        // lives in the window-level listeners attached in handleDragStart.
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483647,
            cursor: 'ew-resize',
            pointerEvents: 'all',
          }}
        />
      )}
    </>
  )
}

import { useState, useEffect } from 'react'
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

const sidebarWidth = () => Math.max(377, Math.round(window.innerHeight / (Math.PHI ** 2)))

const NAV_TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
  { id: 'home',     icon: <FaHouse />,   label: 'Home' },
  { id: 'thread',   icon: <FaMessage />, label: 'Thread' },
  { id: 'settings', icon: <FaGear />,    label: 'Settings' },
]

export const Sidebar = () => {
  const [open, setOpen] = useState(() => localStorage.getItem('hashchan-open') === 'true')
  const [width, setWidth] = useState(sidebarWidth)
  const [activeTab, setActiveTab] = useState<Tab>('thread')
  const ctx = useSiteContext()
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
    const onResize = () => setWidth(sidebarWidth())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const toggle = () => setOpen(v => { localStorage.setItem('hashchan-open', String(!v)); return !v })

  return (
    <>
      {ctx && (
        <div
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
            transition: 'right 0.2618s ease',
            userSelect: 'none',
            fontFamily: 'Monospace, monospace',
          }}
        >
          {open ? 'CLOSE ◀' : 'HASHCHAN ▶'}
        </div>
      )}

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
        transition: 'right 0.2618s ease',
      }}>
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
    </>
  )
}

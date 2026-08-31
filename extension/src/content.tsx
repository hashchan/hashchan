import ReactDOM from 'react-dom/client'
import { App } from './components/App'
import styles from './index.css?inline'
import editorCss from '@uiw/react-markdown-editor/markdown-editor.css?inline'
import previewCss from '@uiw/react-markdown-preview/markdown.css?inline'

declare global {
  interface Math {
    PHI: number
  }
  interface Window {
    __hashchanToggle?: () => void
    __hashchanPendingOpen?: boolean
  }
}

Math.PHI = (1 + Math.sqrt(5)) / 2

// Set once, before mount - Sidebar.tsx listens for the event to toggle open
// state on a click after it's already mounted, and reads the pending flag to
// catch a click that arrives before mount() has run (mount is deferred up to
// 1s waiting on window.ethereum, so the very first click's event would
// otherwise dispatch to no listener and be lost - that first click always
// means "open", since there's no existing panel state yet to toggle).
window.__hashchanToggle = () => {
  window.__hashchanPendingOpen = true
  window.dispatchEvent(new CustomEvent('hashchan:toggle'))
}

function mount() {
  if (document.getElementById('hashchan-host')) return

  const host = document.createElement('div')
  host.id = 'hashchan-host'
  host.style.cssText = 'all:initial;position:fixed;top:0;left:0;z-index:2147483647;'
  document.body.appendChild(host)

  const shadow = host.attachShadow({ mode: 'open' })

  const styleEl = document.createElement('style')
  styleEl.textContent = styles + '\n' + editorCss + '\n' + previewCss
  shadow.appendChild(styleEl)

  const root = document.createElement('div')
  root.id = 'root'
  shadow.appendChild(root)

  ReactDOM.createRoot(root).render(<App />)
}

function tryMount() {
  if (window.ethereum) { mount(); return }
  // MetaMask dispatches this when it finishes injecting window.ethereum
  window.addEventListener('ethereum#initialized', mount, { once: true })
  // Fallback: mount anyway after 1s (no wallet installed, or slow injection)
  setTimeout(() => {
    window.removeEventListener('ethereum#initialized', mount)
    mount()
  }, 1000)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tryMount)
} else {
  tryMount()
}

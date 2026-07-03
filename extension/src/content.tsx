import ReactDOM from 'react-dom/client'
import { App } from './components/App'
import styles from './index.css?inline'
import editorCss from '@uiw/react-markdown-editor/markdown-editor.css?inline'
import previewCss from '@uiw/react-markdown-preview/markdown.css?inline'

declare global {
  interface Math {
    PHI: number
  }
}

Math.PHI = (1 + Math.sqrt(5)) / 2

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

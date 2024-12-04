import { useState } from 'react';

export const BraveWarning = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div style={{
      padding: `${1/Math.PHI}vh ${1/Math.PHI}vw`,
      margin: `${1/Math.PHI}vh 0`,
      backgroundColor: `#111111`,
      border: '1px solid #FFA',
      borderRadius: '4px',
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-start',
      gap: `${1/Math.PHI}rem`
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: `${1/Math.PHI}rem`
      }}>
        <div style={{
          color: '#FFA',
          fontWeight: 800,
          letterSpacing: '1px',
          fontSize: `${(1/Math.PHI) + (1/Math.PHI**3)}rem`,
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: `${1/Math.PHI**2}rem`
        }}>
          <span style={{ fontSize: '1.2em' }}>⚠️</span>
          Brave Browser Detection
        </div>
        <p style={{
          color: '#DDA',
          margin: 0,
          lineHeight: `${Math.PHI}`
        }}>
          Brave's default ethereum RPCs do not support event log scraping. Please follow <a style={{color: '#FFA'}} href="https://support.brave.com/hc/en-us/articles/15616019512845-Changing-the-Default-RPC-Node" target="_blank">these instructions</a> to add your own dedicated RPC from a provider like <a style={{color: '#FFA'}} href="https://infura.io/" target="_blank">Infura</a> or <a style={{color: '#FFA'}} href="https://alchemy.com/" target="_blank">Alchemy</a>
        </p>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        style={{
          color: '#ff0000',
          background: 'none',
          border: 'none',
          fontSize: `${Math.PHI}rem`,
          cursor: 'pointer',
          padding: 0,
          margin: 0,
          lineHeight: 1,
          marginTop: `-${1/Math.PHI}vh`,
          opacity: 0.8,
          transition: 'opacity 0.2s',
          ':hover': {
            opacity: 1
          }
        }}
      >
        ×
      </button>
    </div>
  )
}

import { useAccount } from 'wagmi'
import { ConnectWallet } from '@/components/ConnectWallet'

export const PleaseConnectWallet = () => {
  const { isConnected } = useAccount()

  if (isConnected) {
    return null
  }

  return (
    <div style={{
      backgroundColor: '#090909',
      border: '1px solid #20c20e',
      borderRadius: `${1/(Math.PHI**9)}rem`, // Ultra-sharp corners
      padding: `${1/Math.PHI}vh ${1/Math.PHI}vw`,
      margin: `${1/Math.PHI}vh 0`,
      maxWidth: `${100/Math.PHI}vw`,
      position: 'relative',
      fontFamily: 'monospace',
    }}>
      {/* ASCII-style border decoration */}
      <div style={{
        position: 'absolute',
        top: `-1px`,
        left: `-1px`,
        right: `-1px`,
        height: `${1/(Math.PHI**3)}rem`,
        background: '#20c20e',
        opacity: 0.3,
      }} />
      
      {/* Terminal-style header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: `${1/Math.PHI}rem`,
        borderBottom: '1px solid #20c20e20',
        paddingBottom: `${1/(Math.PHI**2)}rem`,
      }}>
        <span style={{ 
          color: '#20c20e', 
          marginRight: `${1/(Math.PHI**2)}rem`,
          fontSize: `${1/Math.PHI}rem`
        }}>
          [!]
        </span>
        <span style={{ 
          color: '#ff4444', 
          fontSize: `${1/Math.PHI}rem`,
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}>
          CONNECTION_REQUIRED
        </span>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: `${1/(Math.PHI**2)}rem`,
      }}>
        {/* Hackery message */}
        <div style={{ color: '#ccc', fontSize: `${1/(Math.PHI)}rem` }}>
          <div style={{ marginBottom: `${1/(Math.PHI**3)}rem` }}>
            <span style={{ color: '#20c20e' }}>{'>'}</span> No wallet detected
          </div>
          <div style={{ marginBottom: `${1/(Math.PHI**3)}rem` }}>
            <span style={{ color: '#20c20e' }}>{'>'}</span> HashChan requires Ethereum connection
          </div>
          <div>
            <span style={{ color: '#20c20e' }}>{'>'}</span> Initialize web3 provider below:
          </div>
        </div>

        {/* Connection interface */}
        <div style={{ 
          marginTop: `${1/(Math.PHI**2)}rem`,
          padding: `${1/(Math.PHI**2)}rem`,
          border: '1px solid #20c20e20',
          backgroundColor: '#20c20e05',
        }}>
          <ConnectWallet />
        </div>

        {/* Bottom tech decoration */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: `${1/Math.PHI}rem`,
          color: '#20c20e',
          opacity: 0.7,
          marginTop: `${1/(Math.PHI**3)}rem`,
          fontFamily: 'monospace',
        }}>
          <span>PROTOCOL_STATUS: WAITING</span>
          <span>ETH_RPC: NULL</span>
        </div>
      </div>
    </div>
  )
} 
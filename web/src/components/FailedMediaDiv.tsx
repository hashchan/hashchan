import { useState } from 'react'

export const FailedMediaDiv = () => {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div
      style={{
        float: 'left',
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginRight: `${1/ Math.PHI}vw`,
        minHeight: `${100*(Math.PHI - 1)}px`,
        width: `${100*(Math.PHI + 1)}px`,
        maxHeight: `${1000/(Math.PHI**3)}px`,
        backgroundColor: '#090909',
        border: '1px solid #20C20E20',
        color: '#20c20e',
        fontSize: '12px',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      <div>[Media failed to load]</div>
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          marginTop: `${1/Math.PHI**2}rem`,
          cursor: 'help',
          fontSize: `${Math.PHI}rem`,
          color: '#20c20E'
        }}
      >
        ?
      </div>
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: `${1/Math.PHI**2}rem`,
            backgroundColor: '#090909',
            border: '1px solid #20C20E20',
            padding: `${1/Math.PHI**2}rem`,
            width: '250px',
            fontSize: '11px',
            color: '#ddd',
            textAlign: 'left',
            zIndex: 1618,
            lineHeight: '1.4',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              width: '100%',
              paddingBottom: `${1/(Math.PHI**2)}rem`,
              background: '#20C20E20',
              margin: `-${1/(Math.PHI**2)}rem -${1/(Math.PHI**2)}rem ${1/(Math.PHI**2)}rem -${1/(Math.PHI**2)}rem`,
              padding: `${1/(Math.PHI**9)}rem ${1/(Math.PHI**2)}rem`,
              borderBottom: '1px solid #20C20E20',
              color: '#20c20E',
              fontWeight: 'bold'
            }}
          >
            Why did this fail?
          </div>
          <div style={{ marginBottom: `${1/Math.PHI**2}rem` }}>
            HashChan depends on P2P sharing of dynamic content. If the hotlink stops working or the CID cannot be found over IPFS, the media will be lost.
          </div>
          <div
            style={{
              width: '100%',
              paddingBottom: `${1/(Math.PHI**2)}rem`,
              background: '#20C20E20',
              margin: `0 -${1/(Math.PHI**2)}rem ${1/(Math.PHI**2)}rem -${1/(Math.PHI**2)}rem`,
              padding: `${1/(Math.PHI**9)}rem ${1/(Math.PHI**2)}rem`,
              borderBottom: '1px solid #20C20E20',
              color: '#DF3DF1',
              fontWeight: 'bold'
            }}
          >
            Help keep content alive!
          </div>
          <div>
            You can contribute to the network's liveliness by pinning images you like to IPFS.
          </div>
        </div>
      )}
    </div>
  )
}


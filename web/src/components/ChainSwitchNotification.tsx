import { useChainSwitch } from '@/hooks/useChainSwitch'

export const ChainSwitchNotification = () => {
  const { isSwitchingChain, switchError, urlChainId } = useChainSwitch()

  if (!switchError && !isSwitchingChain) {
    return null
  }

  return (
    <>
      {switchError && (
        <div style={{ 
          backgroundColor: '#ff6b6b', 
          color: 'white', 
          padding: `${1/Math.PHI}vh ${1/Math.PHI}vw`, 
          margin: `${1/Math.PHI}vh 0`,
          borderRadius: `${1/(Math.PHI**2)}rem`,
          border: '1px solid #20c20e',
          maxWidth: `${100/Math.PHI}vw`
        }}>
          {switchError}
        </div>
      )}
      {isSwitchingChain && (
        <div style={{ 
          backgroundColor: '#19e377', 
          color: '#090909', 
          padding: `${1/Math.PHI}vh ${1/Math.PHI}vw`, 
          margin: `${1/Math.PHI}vh 0`,
          borderRadius: `${1/(Math.PHI**2)}rem`,
          border: '1px solid #20c20e',
          maxWidth: `${100/Math.PHI}vw`
        }}>
          Switching to chain {urlChainId}...
        </div>
      )}
    </>
  )
} 
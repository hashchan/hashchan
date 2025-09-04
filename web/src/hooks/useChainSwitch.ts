import { useEffect, useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAccount, useSwitchChain } from 'wagmi'

export const useChainSwitch = () => {
  const { chainId: urlChainId } = useParams()
  const { chain, isConnected, isReconnecting } = useAccount()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()
  const [switchError, setSwitchError] = useState<string | null>(null)

  // Handle automatic chain switching when URL chainId doesn't match wallet chainId
  const handleChainSwitch = useCallback(async () => {
    if (!isConnected || isReconnecting) return
    if (!urlChainId || !chain?.id) return
    
    const targetChainId = parseInt(urlChainId)
    
    // If URL chainId matches current wallet chainId, clear any previous errors
    if (targetChainId === chain.id) {
      setSwitchError(null)
      return
    }

    // Only attempt switch if we have a valid target chain ID and it's different from current
    if (targetChainId && targetChainId !== chain.id) {
      try {
        setSwitchError(null)
        switchChain({ chainId: targetChainId })
      } catch (error) {
        setSwitchError(`switchchain::Failed to switch to chain ${targetChainId}. Please switch manually in your wallet.`)
      }
    }
  }, [isConnected, isReconnecting, urlChainId, chain?.id, switchChain])

  useEffect(() => {
    if (!isConnected || isReconnecting) return
    handleChainSwitch()
  }, [isConnected, isReconnecting, handleChainSwitch])

  return {
    isSwitchingChain,
    switchError,
    urlChainId,
    currentChainId: chain?.id,
    clearSwitchError: () => setSwitchError(null)
  }
} 
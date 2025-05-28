import { useEffect, useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAccount, useSwitchChain } from 'wagmi'

export const useChainSwitch = () => {
  const { chainId: urlChainId } = useParams()
  const { chain } = useAccount()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()
  const [switchError, setSwitchError] = useState<string | null>(null)

  // Handle automatic chain switching when URL chainId doesn't match wallet chainId
  const handleChainSwitch = useCallback(async () => {
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
        await switchChain({ chainId: targetChainId })
      } catch (error) {
        console.error('Failed to switch chain:', error)
        setSwitchError(`Failed to switch to chain ${targetChainId}. Please switch manually in your wallet.`)
      }
    }
  }, [urlChainId, chain?.id, switchChain])

  useEffect(() => {
    handleChainSwitch()
  }, [handleChainSwitch])

  return {
    isSwitchingChain,
    switchError,
    urlChainId,
    currentChainId: chain?.id,
    clearSwitchError: () => setSwitchError(null)
  }
} 
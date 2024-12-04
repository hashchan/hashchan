import {
  useEffect,
  useState,
  useCallback
} from 'react'

import { usePublicClient, useAccount } from 'wagmi'

export const useCheckRpc = () => {
  const [isInitialized, setInitialized] = useState(false)
  const { chain } = useAccount()
  const publicClient = usePublicClient()
  const [hasNewFilter, setHasNewFilter] = useState(true)

  const fetchRpcHasNewFilter = useCallback(async () => {
    if (publicClient && chain) {
      try {
        const blockHeight = await publicClient.getBlockNumber()
        const filter = await publicClient.request({
          method: 'eth_newFilter',
          params: [{
            fromBlock: 0n,
            toBlock: blockHeight,
            topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef']
          }]
        })
        console.log('filter', filter)
        const changes = await publicClient.request({
          method: 'eth_getFilterChanges',
          params: [filter]
        })

        console.log('changes', changes)
        setHasNewFilter(true)
      } catch (e) {
        console.log(e)
        setHasNewFilter(false)
      }
    }
  },[publicClient, chain])

  useEffect(() => {
    setInitialized(false)
  }, [chain])

  useEffect(() => {
    if (
      isInitialized ||
      !publicClient ||
      !chain
    ) return

    const init = async () => {
      await fetchRpcHasNewFilter()
      setInitialized(true)
    }
    init()

    , [publicClient, isInitialized, fetchRpcHasNewFilter, chain]
  })

  return {
    hasNewFilter
  }

}

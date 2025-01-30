import { useQueries, useQuery } from '@tanstack/react-query'
import { formatEther } from 'viem'
import { useAccount, usePublicClient } from 'wagmi'
import { useContracts } from '@/hooks/useContracts'
import { useWETHUSDC } from '@/hooks/useWETHUSDC'

// Constants for cache timing
const CACHE_TIME = 1000 * 60 * 30 // 30 minutes
const STALE_TIME = 1000 * 60 * 10 // 10 minutes

export const useEstimateGas = () => {
  const { chain } = useAccount()
  const { hashchan } = useContracts()
  const publicClient = usePublicClient()
  const { pool } = useWETHUSDC()

  // Query for current ETH price
  const { data: ethPrice } = useQuery({
    queryKey: ['ethPrice', chain?.id],
    queryFn: async () => {
      if (!pool) return null
      return pool.wethIsToken0 
        ? parseFloat(pool.pool.token0Price.toSignificant(6))
        : parseFloat(pool.pool.token1Price.toSignificant(6))
    },
    enabled: Boolean(pool && chain?.id),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME
  })

  // Query for current gas price
  const { data: gasPrice } = useQuery({
    queryKey: ['gasPrice', chain?.id],
    queryFn: () => publicClient.getGasPrice(),
    enabled: Boolean(publicClient && chain?.id),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME
  })

  // Use useQueries for parallel gas estimates
  const estimates = useQueries({
    queries: [
      {
        queryKey: ['gasEstimate', 'createThread', chain?.id],
        queryFn: async () => {
          if (!gasPrice || !ethPrice) return null

          const estimate = await publicClient.estimateContractGas({
            address: hashchan.address as `0x${string}`,
            abi: hashchan.abi,
            functionName: 'createThread',
            args: [
              0,
              "Welcome to Hashchan",
              'https://bafkreicaumqhcbzvi653dkntzzyvacgxfquksgrsu2dltrx24bl2zaikva.ipfs.w3s.link/',
              'bafkreicaumqhcbzvi653dkntzzyvacgxfquksgrsu2dltrx24bl2zaikva',
              'abcdefghijklmnopqrstuvwxyz'
            ]
          })

          const gasCost = formatEther(gasPrice * estimate)
          return Number(gasCost) * ethPrice
        },
        enabled: Boolean(
          chain?.id && 
          hashchan && 
          publicClient && 
          pool &&
          gasPrice &&
          ethPrice
        ),
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME
      },
      {
        queryKey: ['gasEstimate', 'createPost', chain?.id],
        queryFn: async () => {
          if (!gasPrice || !ethPrice) return null

          const estimate = await publicClient.estimateContractGas({
            address: hashchan.address as `0x${string}`,
            abi: hashchan.abi,
            functionName: 'createPost',
            args: [
              0,
              "0x9d44a4ec328db0ce6de3ae1d63080b983ff9943c2f3cf9e459bf18e7d74c3777",
              ["0x9d44a4ec328db0ce6de3ae1d63080b983ff9943c2f3cf9e459bf18e7d74c3777"],
              'https://bafkreicaumqhcbzvi653dkntzzyvacgxfquksgrsu2dltrx24bl2zaikva.ipfs.w3s.link/',
              'bafkreicaumqhcbzvi653dkntzzyvacgxfquksgrsu2dltrx24bl2zaikva',
              'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz'
            ]
          })

          const gasCost = formatEther(gasPrice * estimate)
          return Number(gasCost) * ethPrice
        },
        enabled: Boolean(
          chain?.id && 
          hashchan && 
          publicClient && 
          pool &&
          gasPrice &&
          ethPrice
        ),
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME
      }
    ]
  })

  const [threadEstimate, postEstimate] = estimates

  return {
    createThreadEstimate: threadEstimate.data,
    createPostEstimate: postEstimate.data,
    isLoading: threadEstimate.isLoading || postEstimate.isLoading,
    error: threadEstimate.error || postEstimate.error,
    // Manual refetch functions if needed
    refetch: {
      thread: threadEstimate.refetch,
      post: postEstimate.refetch
    }
  }
}

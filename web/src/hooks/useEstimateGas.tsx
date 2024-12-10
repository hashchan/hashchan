import {
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react'

import {
  formatEther, 
} from 'viem'

import { 
  useAccount,
  usePublicClient,
} from 'wagmi'


import { useContracts } from '@/hooks/useContracts'
import { useWETHUSDC } from '@/hooks/useWETHUSDC'

export const useEstimateGas = () => {
  const [isInitialized, setInitialized] = useState(false)
  const { pool } = useWETHUSDC()
  const [ethPrice, setEthPrice] = useState(null)
  const [gasPrice, setGasPrice] = useState(null)
  const { chain } = useAccount()
  const { contractAddress, abi } = useContracts()
  const publicClient = usePublicClient();
  const [createThreadEstimate, setCreateThreadEstimate] = useState(null)
  const [createPostEstimate, setCreatePostEstimate] = useState(null)


  const fetchGasEstimateCreateThread = useCallback(async () => {
    if (
      chain &&
      contractAddress &&
      abi &&
      publicClient &&
      pool
    ) {
      const gasPrice = await publicClient.getGasPrice()
      let ethPrice;
      console.log(pool)
      if (pool.wethIsToken0) {
        ethPrice = parseFloat(pool.pool.token0Price.toSignificant(6))
      } else {
        ethPrice = parseFloat(pool.pool.token1Price.toSignificant(6))
      }

      const estimate = await publicClient.estimateContractGas({
        address: contractAddress as `0x${string}`,
        abi,
        functionName: 'createThread',
        args: [
          0,
          "Welcome to Hashchan",
          'https://bafkreicaumqhcbzvi653dkntzzyvacgxfquksgrsu2dltrx24bl2zaikva.ipfs.w3s.link/',
          'abcdefghijklmnopqrstuvwxyz'
        ]
      })
      const gasCost = formatEther((gasPrice) * (estimate))
      const estimateUsd = Number(gasCost) * ethPrice
      setCreateThreadEstimate(Number(estimateUsd))
    }
  },[
    chain,
    contractAddress,
    abi,
    publicClient,
    pool
  ])

  const fetchGasEstimateCreatePost = useCallback(async () => {
    if (
      chain &&
      contractAddress &&
      abi &&
      publicClient &&
      pool
    ) {
      const gasPrice = await publicClient.getGasPrice()
      let ethPrice;
      if (pool.wethIsToken0) {
        ethPrice = parseFloat(pool.pool.token0Price.toSignificant(6))
      } else {
        ethPrice = parseFloat(pool.pool.token1Price.toSignificant(6))
      }
      const estimate = await publicClient.estimateContractGas({
        address: contractAddress as `0x${string}`,
        abi,
        functionName: 'createPost',
        args: [
          0,
          "0x9d44a4ec328db0ce6de3ae1d63080b983ff9943c2f3cf9e459bf18e7d74c3777",
          ["0x9d44a4ec328db0ce6de3ae1d63080b983ff9943c2f3cf9e459bf18e7d74c3777"],
          'https://bafkreicaumqhcbzvi653dkntzzyvacgxfquksgrsu2dltrx24bl2zaikva.ipfs.w3s.link/',
          'abcdefghijklmnopqrstuvwxyz'
        ]
      })
      const gasCost = formatEther((gasPrice) * (estimate))
      const estimateUsd = Number(gasCost) * ethPrice
      setCreatePostEstimate(Number(estimateUsd))
    }
  },[
    chain,
    contractAddress,
    abi,
    publicClient,
    pool
  ])

  useEffect(() => {
    setInitialized(false)
  }, [
    chain
  ])

  useEffect(() => {
    if (isInitialized ||
        !chain ||
        !contractAddress ||
        !abi ||
        !publicClient ||
        !pool
       ) return

      const init = async () => {
          await fetchGasEstimateCreateThread()
          await fetchGasEstimateCreatePost()
          setInitialized(true)
      }
      init()
  }, [
    isInitialized,
    chain,
    contractAddress,
    abi,
    publicClient,
    fetchGasEstimateCreateThread,
    fetchGasEstimateCreatePost,
    pool
  ])

  return {
    fetchGasEstimateCreatePost,
    fetchGasEstimateCreateThread,
    createThreadEstimate,
    createPostEstimate
  }
}

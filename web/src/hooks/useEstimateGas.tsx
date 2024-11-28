import {
  useState,
  useEffect,
  useCallback,
} from 'react'

import {
  formatEther,
  formatUnits
} from 'viem'

import { 
  useAccount,
  usePublicClient,
} from 'wagmi'

import { BigintIsh  } from '@uniswap/sdk-core';

import { Pool, FeeAmount } from '@uniswap/v3-sdk'
import { Token } from '@uniswap/sdk-core'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';


import { useContract } from '@/hooks/useContract'

const USDC_ETH = "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"

const WETH = new Token(
  1,
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  18,
  "WETH",
  "Wrapped Ether"
)

const USDC = new Token(
  1,
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  6,
  "USDC",
  "USD Coin"
)





export const useEstimateGas = () => {
  const [isInitialized, setInitialized] = useState(false)
  const [ethPrice, setEthPrice] = useState(null)
  const [gasPrice, setGasPrice] = useState(null)
  const { chain } = useAccount()
  const { contractAddress, abi } = useContract()
  const publicClient = usePublicClient();
  const [createThreadEstimate, setCreateThreadEstimate] = useState(null)
  const [createPostEstimate, setCreatePostEstimate] = useState(null)


  const fetchGasPrice = useCallback(async () => {
    if (chain && publicClient) {
      const gasPrice = await publicClient.getGasPrice()
      setGasPrice(gasPrice)
    }
  },[
    chain,
    publicClient
  ])

  const fetchEthPrice = useCallback(async () => {
    if (chain && publicClient) {
      const [slot0, liquidity] = await Promise.all([
        publicClient.readContract({
          address: USDC_ETH as `0x${string}`,
          abi: IUniswapV3PoolABI.abi,
          functionName: 'slot0'
        }),
        publicClient.readContract({
          address: USDC_ETH as `0x${string}`,
          abi: IUniswapV3PoolABI.abi,
          functionName: 'liquidity'
        })
      ])

      const sqrtPriceX96 = slot0[0].toString()
      const currentTick = slot0[1]
      const liquidityBigInt = liquidity.toString() as BigintIsh;

      const pool = new Pool(
        WETH,
        USDC,
        FeeAmount.LOW,
        sqrtPriceX96,
        liquidityBigInt,
        currentTick
      )

      const price = parseFloat(pool.token1Price.toSignificant(6))
      console.log('price', price)

      setEthPrice(price)
    }
  },[
    chain,
    publicClient
  ])

  const fetchGasEstimateCreateThread = useCallback(async () => {
    if (
      chain &&
      contractAddress &&
      abi &&
      publicClient &&
      gasPrice &&
      ethPrice
    ) {

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
      console.log('estimate', estimate)
      console.log('estimate', estimate)
      const gasCost = formatEther((gasPrice) * (estimate))
      const estimateUsd = Number(gasCost) * ethPrice
      setCreateThreadEstimate(Number(estimateUsd))
    }
  },[
    chain,
    contractAddress,
    abi,
    publicClient,
    gasPrice,
    ethPrice
  ])

  const fetchGasEstimateCreatePost = useCallback(async () => {
    console.log(
      Boolean(chain),
      Boolean(contractAddress),
      Boolean(abi),
      Boolean(publicClient),
      Boolean(gasPrice),
      Boolean(ethPrice)
    )
    console.log('ether price', ethPrice)
    if (
      chain &&
      contractAddress &&
      abi &&
      publicClient &&
      gasPrice &&
      ethPrice
    ) {

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
      console.log('estimate', estimate)
      const gasCost = formatEther((gasPrice) * (estimate))
      const estimateUsd = Number(gasCost) * ethPrice
      setCreatePostEstimate(Number(estimateUsd))
    }
  },[
    chain,
    contractAddress,
    abi,
    publicClient,
    gasPrice,
    ethPrice
  ])

  useEffect(() => {
    if (chain && publicClient) {
      if (chain.id !== 1) return
      fetchGasPrice()
      fetchEthPrice()
    }
  }, [
    chain,
    publicClient,
    fetchGasPrice,
    fetchEthPrice
  ])

  useEffect(() => {
    if (isInitialized ||
        !chain ||
        !contractAddress ||
        !abi ||
        !publicClient ||
        !gasPrice ||
        !ethPrice
       ) return

      const init = async () => {
        if (chain.id === 1) {
          await fetchGasEstimateCreateThread()
          await fetchGasEstimateCreatePost()
        }
          setInitialized(true)
      }
      init()
  }, [
    isInitialized,
    chain,
    contractAddress,
    abi,
    publicClient,
    gasPrice,
    ethPrice,
    fetchGasEstimateCreateThread,
    fetchGasEstimateCreatePost
  ])

  return {
    fetchGasEstimateCreatePost,
    fetchGasEstimateCreateThread,
    createThreadEstimate,
    createPostEstimate
  }
}

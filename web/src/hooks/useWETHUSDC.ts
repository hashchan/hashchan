import { 
  useState,
  useEffect,
  useCallback
} from 'react'

import {
  useAccount,
  usePublicClient,
} from 'wagmi'

import { Pool, FeeAmount } from '@uniswap/v3-sdk'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';

import { BigintIsh, Token  } from '@uniswap/sdk-core';

const chainUniswapMap = {
  1: {
    weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    pool: "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8",
    fee: FeeAmount.LOW
  },
  10: {
    weth: "0x4200000000000000000000000000000000000006",
    usdc: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    pool: "0x1fb3cf6e48F1E7B10213E7b6d87D4c073C7Fdb7b",
    fee: FeeAmount.LOW
  },
  8453: {
    weth: "0x4200000000000000000000000000000000000006",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    pool: "0xd0b53D9277642d899DF5C87A3966A349A798F224",
    fee: FeeAmount.LOW
  },
  42161: {
    weth: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    pool: "0xC6962004f452bE9203591991D15f6b388e09E8D0",
    fee: FeeAmount.LOW
  }
}



export const useWETHUSDC = () => {
  const [isInitialized, setInitialized] = useState(false)
  const { chain } = useAccount()
  const publicClient = usePublicClient();
  const [pool, setPool] = useState(null)

  const fetchPool = useCallback(async () => {
    if (publicClient && chain) {
      const uniswap = chainUniswapMap[chain.id]
      if (!uniswap) return;

      const WETH = new Token(
        chain.id,
        uniswap.weth as `0x${string}`,
        18,
        "WETH",
        "Wrapped Ether"
      )

      const USDC = new Token(
        chain.id,
        uniswap.usdc as `0x${string}`,
        6,
        "USDC",
        "USD Coin"
      )

      const [slot0, liquidity] = await Promise.all([
        publicClient.readContract({
          address: uniswap.pool as `0x${string}`,
          abi: IUniswapV3PoolABI.abi,
          functionName: 'slot0'
        }),
        publicClient.readContract({
          address: uniswap.pool as `0x${string}`,
          abi: IUniswapV3PoolABI.abi,
          functionName: 'liquidity'
        }),
      ])
      const sqrtPriceX96 = slot0[0].toString()
      const currentTick = slot0[1]
      const liquidityBigInt = liquidity.toString() as BigintIsh;
      setPool(new Pool(
        WETH,
        USDC,
        uniswap.fee,
        sqrtPriceX96,
        liquidityBigInt,
        currentTick,
      ))
    }
  }, [publicClient, chain])


  useEffect(() => {
    setInitialized(false)
    setPool(null)
  },[chain])


  useEffect(() => {
    if (isInitialized ||
      !chain ||
      !publicClient) return

      const init = async () => {
        await fetchPool()
        setInitialized(true)
      }
      init()
  },[
    isInitialized,
    chain,
    publicClient,
    fetchPool
  ])

  return {
    pool,
    fetchPool,
  }
}


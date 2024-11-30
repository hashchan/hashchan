import { 
  useState,
  useEffect,
  useCallback
} from 'react'

import {
  getAddress
} from 'viem'

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
    fee: FeeAmount.LOW,
    wethIsToken0: false
  },
  10: {
    weth: "0x4200000000000000000000000000000000000006",
    usdc: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    pool: "0x1fb3cf6e48F1E7B10213E7b6d87D4c073C7Fdb7b",
    fee: FeeAmount.LOW,
    wethIsToken0: false
  },
  8453: {
    weth: "0x4200000000000000000000000000000000000006",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    pool: "0xd0b53D9277642d899DF5C87A3966A349A798F224",
    fee: FeeAmount.LOW,
    wethIsToken0: true
  },
  42161: {
    weth: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    pool: "0xC6962004f452bE9203591991D15f6b388e09E8D0",
    fee: FeeAmount.LOW,
    wethIsToken0: true
  },
  137: {
    weth: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    pool: "0xA4D8c89f0c20efbe54cBa9e7e7a7E509056228D9",
    fee: FeeAmount.LOW,
    wethIsToken0: true
  },
  43114: {
    weth: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB",
    usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    pool: "0x43fb9c3fd6715e872272B0CAAB968A97692726EB",
    fee: FeeAmount.LOW,
    wethIsToken0: false
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

      const pool = new Pool(
        WETH,
        USDC,
        uniswap.fee,
        sqrtPriceX96,
        liquidityBigInt,
        currentTick,
      )
      setPool({
        pool,
        wethIsToken0: uniswap.wethIsToken0
      })
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


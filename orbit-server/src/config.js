import { 
  createPublicClient,
  createWalletClient,
  http,
  getContract
} from 'viem'

import { privateKeyToAccount } from 'viem/accounts'

import {
  mainnet,
  classic,
  base,
  sepolia,
  optimism
} from 'viem/chains'

import  ModerationService from './abi/ModerationService.json' with {type: "json"}

export const account = privateKeyToAccount(process.env.OWNER_KEY)

export const chains = [ base, sepolia, optimism ]

export const publicClients = {
  1: createPublicClient({
    chain: mainnet,
    transport: http(process.env.MAINNET_RPC_URL)
  }),
  61: createPublicClient({
    chain: classic,
    transport: http(process.env.CLASSIC_RPC_URL)
  }),
  8453: createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL)
  }),
  11155111: createPublicClient({
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL)
  }),
  10: createPublicClient({
    chain: optimism,
    transport: http(process.env.OPTIMISM_RPC_URL)
  })
}

export const walletClients = {
  1: createWalletClient({
    account,
    chain: mainnet,
    transport: http(process.env.MAINNET_RPC_URL)
  }),
  61: createWalletClient({
    account,
    chain: classic,
    transport: http(process.env.CLASSIC_RPC_URL)
  }),
  8453: createWalletClient({
    account,
    chain: base,
    transport: http(process.env.BASE_RPC_URL)
  }),
  11155111: createWalletClient({
    account,
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL)
  }),
  10: createWalletClient({
    account,
    chain: optimism,
    transport: http(process.env.OPTIMISM_RPC_URL)
  })
}

export const instances = {
  1: getContract({
    address: ModerationService["1"].address,
    abi: ModerationService.abi,
    client: {
      public: publicClients['1'],
      wallet: walletClients['1']
    }
  }),
  61: getContract({
    address: ModerationService["61"].address,
    abi: ModerationService.abi,
    client: {
      public: publicClients['61'],
      wallet: walletClients['61']
    }
  }),
  8453: getContract({
    address: ModerationService["8453"].address,
    abi: ModerationService.abi,
    client: {
      public: publicClients['8453'],
      wallet: walletClients['8453']
    }
  }),
  11155111: getContract({
    address: ModerationService["11155111"].address,
    abi: ModerationService.abi,
    client: {
      public: publicClients['11155111'],
      wallet: walletClients['11155111']
    }
  }),
  10: getContract({
    address: ModerationService["10"].address,
    abi: ModerationService.abi,
    client: {
      public: publicClients['10'],
      wallet: walletClients['10']
    }
  }),
}


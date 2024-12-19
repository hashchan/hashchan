import { 
  createPublicClient,
  createWalletClient,
  http,
  getContract
} from 'viem'

import { privateKeyToAccount } from 'viem/accounts'

import { base, sepolia } from 'viem/chains'
import  ModerationService from './abi/ModerationService.json' with {type: "json"}

export const account = privateKeyToAccount(process.env.OWNER_KEY)

export const chains = [ base, sepolia ]

export const publicClients = {
  8453: createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL)
  }),
  11155111: createPublicClient({
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL)
  })
}

export const walletClients = {
  8453: createWalletClient({
    account,
    chain: base,
    transport: http(process.env.BASE_RPC_URL)
  }),
  11155111: createWalletClient({
    account,
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL)
  })
}

export const instances = {
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
}


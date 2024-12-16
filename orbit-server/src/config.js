import { 
  createPublicClient,
  createWalletClient,
  http,
  getContract
} from 'viem'

import { privateKeyToAccount } from 'viem/accounts'

import { sepolia } from 'viem/chains'
import  ModerationService from './abi/ModerationService.json' with {type: "json"}

export const account = privateKeyToAccount(process.env.OWNER_KEY)


export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL)
})

export const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL)
})


export const modServiceInstance = getContract({
  address: process.env.MOD_SERVICE_ADDRESS,
  abi: ModerationService.abi,
  client: {
    public: publicClient,
    wallet: walletClient
  }
})



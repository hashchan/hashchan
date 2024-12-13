import { 
  createPublicClient,
  createWalletClient,
  http,
  getContract
} from 'viem'

import { sepolia } from 'viem/chains'
import  ModerationService from './abi/ModerationService.json' with {type: "json"}

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL)
})

export const modServiceInstance = getContract({
  address: process.env.MOD_SERVICE_ADDRESS,
  abi: ModerationService.abi,
  client: publicClient
})



import { 
  createPublicClient,
  createWalletClient,
  http
} from 'viem'

import { sepolia } from 'viem/chains'

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL)
})




import { createConfig } from 'wagmi'
import { classic, mainnet, sepolia, base, optimism } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { custom } from 'viem'

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [injected()],
  transports: {
    [mainnet.id]: custom(window.ethereum!),
//    [base.id]: custom(window.ethereum!),
//    [optimism.id]: custom(window.ethereum!),
    [sepolia.id]: custom(window.ethereum!),
//    [classic.id]: custom(window.ethereum!),
  },
})

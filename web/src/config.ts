import { http, createConfig } from 'wagmi'

import { classic, mainnet, sepolia, base, baseSepolia, localhost, optimismSepolia, optimism, fantom } from 'wagmi/chains'
import { custom } from 'viem'
import { unstable_connector, fallback } from '@wagmi/core'
import { injected, walletConnect } from 'wagmi/connectors'

console.log(import.meta.env.VITE_WALLETCONNECT_PROJECT_ID)


const metadata = {
    name: 'HashChan',
    description: 'imageboard inside ethereum eventlogs',
    url: 'https://hashchan.network', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
    explore: 'https://hashchan.network',    
}

export const config = createConfig({
  chains: [classic, mainnet, sepolia, base, baseSepolia, localhost, optimismSepolia, optimism, fantom],
  connectors: [
    walletConnect({
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
      metadata
    }),
  ],
  transports: {
    [classic.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
    [mainnet.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
    [sepolia.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
    [localhost.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
    [optimismSepolia.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
    [optimism.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
    [fantom.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
    [base.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
    [baseSepolia.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
  },
})

export const chainIdMap = (chainId: number) => {
  switch (chainId) {
    case 84532:
      return 'Base Sepolia'
    case 8453:
      return 'Base'
    case 250:
      return 'Fantom Opera'
    case 61:
      return 'Ethereum Classic'
    case 1:
      return 'Ethereum Mainnet'
    case 11155111:
      return 'Sepolia Testnet'
    case 31337:
      return 'Localhost'
    case 11155420:
      return 'Optimism Sepolia Testnet'
    case 10:
      return "Optimism Mainnet"
    default:
      return "Unsupported Chain"  
  }
}

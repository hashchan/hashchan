import { http, createConfig } from 'wagmi'

import { classic, mainnet, sepolia, localhost, optimismSepolia, optimism } from 'wagmi/chains'
import { unstable_connector } from '@wagmi/core'
import { injected, walletConnect } from 'wagmi/connectors'

//import { injected } from 'wagmi/connectors'
console.log(import.meta.env.VITE_WALLETCONNECT_PROJECT_ID)


const metadata = {
    name: 'HashChan',
    description: 'imageboard inside ethereum eventlogs',
    url: 'https://hashchan.network', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
    explore: 'https://hashchan.network',    
}

export const config = createConfig({
  chains: [classic, mainnet, sepolia, localhost, optimismSepolia, optimism],
  connectors: [
    walletConnect({
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
      metadata
    }),
  ],
  transports: {
    [classic.id]: unstable_connector(injected),
    [mainnet.id]: unstable_connector(injected),
    [sepolia.id]: unstable_connector(injected),
    [localhost.id]: http(),
    [optimismSepolia.id]: unstable_connector(injected),
    [optimism.id]: unstable_connector(injected),
  },
})

export const chainIdMap = (chainId: number) => {
  switch (chainId) {
    case 61:
      return 'Ethereum Classic'
    break;
    case 1:
      return 'Ethereum Mainnet'
    break;
    case 11155111:
      return 'Sepolia Testnet'
    break;
    case 31337:
      return 'Localhost'
    break;
    case 11155420:
      return 'Optimism Sepolia Testnet'
    case 10:
      return "Optimism Mainnet"
    default:
      return "Unsupported Chain"  
  }
}

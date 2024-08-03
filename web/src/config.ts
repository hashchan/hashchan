import { http, createConfig } from 'wagmi'

import { sepolia, localhost, optimismSepolia } from 'wagmi/chains'
import { unstable_connector } from '@wagmi/core'
import { injected, walletConnect } from 'wagmi/connectors'

//import { injected } from 'wagmi/connectors'
console.log(import.meta.env.VITE_WALLETCONNECT_PROJECT_ID)


const metadata = {
    name: 'HashChan',
    description: 'imageboard inside ethereum eventlogs',
    url: 'hashchan.network', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/37784886']
          
}

export const config = createConfig({
  chains: [localhost, sepolia, optimismSepolia ],
  connectors: [
    walletConnect({projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID, metadata}),
  ],
  transports: {
    [localhost.id]: http(),
    [sepolia.id]: unstable_connector(injected),
    [optimismSepolia.id]: unstable_connector(injected),
  },
})

export const chainIdMap = (chainId: number) => {
  switch (chainId) {
    case 11155111:
      return 'Sepolia Testnet'
    break;
    case 31337:
      return 'Localhost'
    break;
    case 11155420:
      return 'Optimism Sepolia Testnet'
    default:
      return "Unsupported Chain"  
  }
}

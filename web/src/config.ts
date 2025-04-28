import { createConfig } from 'wagmi'

import {
  classic,
  mainnet,
  sepolia,
  base,
  baseSepolia,
  localhost,
  optimismSepolia,
  optimism,
  fantom,
  arbitrumSepolia,
  arbitrum,
  arbitrumNova,
  flowMainnet,
  flowTestnet,
  polygon,
  avalanche
} from 'wagmi/chains'

import { custom } from 'viem'
import { injected, unstable_connector, fallback } from '@wagmi/core'
import { walletConnect } from 'wagmi/connectors'

const metadata = {
    name: 'HashChan',
    description: 'imageboard inside ethereum eventlogs',
    url: 'https://hashchan.org', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
    explore: 'https://hashchan.org',    
}
// if import.met.env.VITE_WALLETCONNECT_PROJECT_ID is not set
const connectors = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?
  [walletConnect({ projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID, metadata })] : []
export const config = createConfig({
  chains: [
    classic,
    mainnet,
    base,
    sepolia,
//    baseSepolia,
//    localhost,
//    optimismSepolia,
    optimism,
//    fantom,
//    arbitrumSepolia,
//    arbitrum,
//    arbitrumNova,
//    flowMainnet,
//    flowTestnet,
//    avalanche,
//    polygon
  ],
  connectors,
  transports: {
//    [localhost.id]: fallback([injected(), custom(window.ethereum!), unstable_connector(injected)]),
    [classic.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
    /*
    [mainnet.id]: custom({
      async request({ method, params }) { 
        console.log('method', method)
        console.log('params', params)
        const response = await window.ethereum.request({ method, params })
        console.log('response', response)
        return response
        

      }

    }),
   */
    [mainnet.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
    [sepolia.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
      //[optimismSepolia.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
      [optimism.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
//    [fantom.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
    [base.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
//    [baseSepolia.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
//    [arbitrumSepolia.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
//    [arbitrum.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
//    [arbitrumNova.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
//    [flowMainnet.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
//    [flowTestnet.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
//    [polygon.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
//    [avalanche.id]: fallback([custom(window.ethereum!), unstable_connector(injected)]),
  },
})


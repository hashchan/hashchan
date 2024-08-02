import { http, createConfig } from 'wagmi'
import { sepolia, localhost } from 'wagmi/chains'
import { unstable_connector } from '@wagmi/core'
import { injected } from 'wagmi/connectors'
//import { injected } from 'wagmi/connectors'
export const config = createConfig({
  chains: [localhost, sepolia ],
  connectors: [],
  transports: {
    [localhost.id]: http(),
    [sepolia.id]: unstable_connector(injected),
  },
})

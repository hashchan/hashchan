import { http, createConfig } from 'wagmi'
import { mainnet, localhost } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
export const config = createConfig({
  chains: [localhost, mainnet ],
  connectors: [injected()],
  transports: {
    [localhost.id]: http(),
    [mainnet.id]: http(),
  },
})

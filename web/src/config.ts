import { http, createConfig } from 'wagmi'
import { mainnet, localhost } from 'wagmi/chains'

export const config = createConfig({
  chains: [localhost, mainnet ],
  transports: {
    [localhost.id]: http(),
    [mainnet.id]: http(),
  },
})

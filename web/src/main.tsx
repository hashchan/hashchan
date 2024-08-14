import './index.css'

import ReactDOM from 'react-dom/client'

import { RouterProvider } from 'react-router-dom'
import { router } from './router'

import { QueryClient, QueryClientProvider  } from '@tanstack/react-query'
import { WagmiProvider  } from 'wagmi'
import { config	} from './config'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <WagmiProvider config={config}>
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </WagmiProvider>
  ,
)

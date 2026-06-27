import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { IDBProvider } from '@hashchan/hooks'
import { config } from '../config'
import { Sidebar } from './Sidebar'
import { ErrorBoundary } from './ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 60,
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
})

export const App = () => (
  <ErrorBoundary>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <IDBProvider>
          <ErrorBoundary>
            <Sidebar />
          </ErrorBoundary>
        </IDBProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </ErrorBoundary>
)

import './index.css'
import { initializeAnalytics } from './utils/gtm'

// Initialize analytics
initializeAnalytics()

// Extend Math interface globally
declare global {
  interface Math {
    /**
     * The golden ratio (φ or phi)
     * Approximately equals 1.618033988749895
     */
    PHI: number;
  }
}

// Add PHI to Math object
Math.PHI = (1 + Math.sqrt(5)) / 2;

// Make it non-configurable and non-writable like other Math constants
Object.defineProperty(Math, 'PHI', {
  enumerable: false,
  configurable: false,
  writable: false,
});

import ReactDOM from 'react-dom/client'

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider  } from '@tanstack/react-query'
import { WagmiProvider  } from 'wagmi'
import { config } from './config'

import { IDBProvider } from '@/provider/IDBProvider'
import { HeliaProvider } from '@/provider/HeliaProvider'
import { W3UpProvider } from '@/provider/W3UpProvider'
import { ModerationServicesProvider } from "@/provider/ModerationServicesProvider";

import {NavBar} from '@/components/NavBar'
import { RouteTracker } from './components/RouteTracker'

import { NotFound } from "@/components/NotFound";
import { Warnings } from "@/components/Warnings";
import { Home } from "@/routes/Home";
import { Docs } from "@/routes/Docs/Docs";
import { Intro } from "@/routes/Docs/Intro";
import { Instructions } from "@/routes/Docs/Instructions";
import { TOSPP, TOSPPBanner, TOSProvider } from "@/routes/TOSPP";

import { Janitors } from "@/routes/Janitors/Janitors";
import { Janitor } from "@/routes/Janitors/Janitor/Janitor";

import { Chain } from "@/routes/Chains/Chain/Chain";
import { Board } from "@/routes/Chains/Chain/Boards/Board/Board";
import { Catalogue } from "@/routes/Chains/Chain/Boards/Board/Catalogue";
import { Thread } from "@/routes/Chains/Chain/Boards/Board/Threads/Thread/Thread";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={new QueryClient()}>
      <W3UpProvider>
        <IDBProvider>
          <HeliaProvider>
            <ModerationServicesProvider>
              <TOSProvider>
                <BrowserRouter>
                  <RouteTracker />
                  <NavBar />
                  <Warnings />
                  <Routes>
                    <Route path="/tospp" element={<TOSPP />} />
                    <Route path="/janitors" element={<Janitors />} />
                    <Route path="/janitors/:janitorAddress" element={<Janitor />} />
                    <Route path="/docs/:docversion" element={<Docs />}>
                      <Route path="intro" element={<Intro />} />
                      <Route path="instructions" element={<Instructions />} />
                    </Route>
                    <Route path="/chains/:chainId" element={<Chain />}>
                      <Route path="boards/:boardId" element={<Board />}>
                        <Route path="catalogue" element={<Catalogue />} />
                        <Route path="threads/:threadId" element={<Thread />} />
                      </Route>
                    </Route>
                    <Route path="/" element={<Home />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <TOSPPBanner />
                </BrowserRouter>
              </TOSProvider>
            </ModerationServicesProvider>
          </HeliaProvider>
        </IDBProvider>
      </W3UpProvider>
    </QueryClientProvider>
  </WagmiProvider>
  ,
)

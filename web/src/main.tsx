import './index.css'
import { initializeGTM } from './utils/gtm'

// Initialize GTM
initializeGTM()

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
import { W3UpProvider } from '@/provider/W3UpProvider'

import {NavBar} from '@/components/NavBar'

import { NotFound } from "@/components/NotFound";
import { Home } from "@/routes/Home";
import { Docs } from "@/routes/Docs/Docs";
import { Intro } from "@/routes/Docs/Intro";
import { Instructions } from "@/routes/Docs/Instructions";
import { TOSPP, TOSPPBanner, TOSProvider } from "@/routes/TOSPP";

import { Chain } from "@/routes/Chain";
import { Board } from "@/routes/Board";
import { Catalogue } from "@/routes/Catalogue";
import { Thread } from "@/routes/Thread";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={new QueryClient()}>
      <W3UpProvider>
        <IDBProvider>
          <TOSProvider>
            <BrowserRouter>
              <NavBar />
              <Routes>
                <Route path="/tospp" element={<TOSPP />} />
                <Route path="/" element={<Home />}>
                  <Route path="docs/:docversion" element={<Docs />}>
                    <Route path="intro" element={<Intro />} />
                    <Route path="instructions" element={<Instructions />} />
                  </Route>
                  <Route path="chains/:chainId" element={<Chain />}>
                    <Route path="boards/:boardId" element={<Board />}>
                      <Route path="catalogue" element={<Catalogue />} />
                      <Route path="thread/:threadId" element={<Thread />} />
                    </Route>
                  </Route>
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
              <TOSPPBanner />
            </BrowserRouter>
          </TOSProvider>
        </IDBProvider>
      </W3UpProvider>
    </QueryClientProvider>
  </WagmiProvider>
  ,
)

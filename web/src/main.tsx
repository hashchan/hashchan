import './index.css'

import ReactDOM from 'react-dom/client'

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider  } from '@tanstack/react-query'
import { WagmiProvider  } from 'wagmi'
import { config	} from './config'

import { W3UpProvider } from '@/provider/W3UpProvider'

import {NavBar} from '@/components/NavBar'

import { NotFound } from "@/components/NotFound";
import { Root } from "@/Root";
import { Docs } from "@/routes/Docs/Docs";
import { Intro } from "@/routes/Docs/Intro";
import { Instructions } from "@/routes/Docs/Instructions";

import { Board } from "@/routes/Board";
import { Catalogue } from "@/routes/Catalogue";
import { Thread } from "@/routes/Thread";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={new QueryClient()}>
      <W3UpProvider>
        <BrowserRouter>
          <NavBar />
          <Routes>
            <Route path="/" element={<Root />}>
              <Route path="docs/:docversion" element={<Docs />}>
                <Route path="intro" element={<Intro />} />
                <Route path="instructions" element={<Instructions />} />
              </Route>
              <Route path="boards/:board" element={<Board />}>
                <Route path="catalogue" element={<Catalogue />} />
                <Route path="thread/:thread" element={<Thread />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </W3UpProvider>
    </QueryClientProvider>
  </WagmiProvider>
  ,
)

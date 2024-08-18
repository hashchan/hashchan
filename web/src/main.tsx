import './index.css'

import ReactDOM from 'react-dom/client'

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider  } from '@tanstack/react-query'
import { WagmiProvider  } from 'wagmi'
import { config	} from './config'

import {NavBar} from './components/NavBar'

import { NotFound } from "./components/NotFound";
import { Root } from "./Root";
import { Board } from "./routes/Board";
import { Catalogue } from "./routes/Catalogue";
import { Thread } from "./routes/Thread";
ReactDOM.createRoot(document.getElementById('root')!).render(
    <WagmiProvider config={config}>
      <QueryClientProvider client={new QueryClient()}>
        <BrowserRouter>
          <NavBar />
          <Routes>
            <Route path="/" element={<Root />}>
              <Route path="boards/:board" element={<Board />}>
                <Route path="catalogue" element={<Catalogue />} />
                <Route path="thread/:thread" element={<Thread />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  ,
)

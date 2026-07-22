import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, '/src')   }],
    // @hashchan/hooks is file-linked, and its own node_modules carries these
    // same packages (needed for its test suite) — without deduping, the prod
    // build can bundle two separate React instances (one via web's
    // node_modules, one via hooks/node_modules), so hooks called from within
    // @hashchan/hooks register against a dispatcher the rendering tree isn't
    // actually using, surfacing as "Cannot read properties of null (reading
    // 'useState')". Matches extension/vite.config.ts's existing dedupe list.
    dedupe: ['react', 'react-dom', 'wagmi', 'viem', '@tanstack/react-query', 'dexie'],
  },
  define: {
  "process.env.DRAGGABLE_DEBUG": JSON.stringify(process.env.DRAGGABLE_DEBUG ?? false),
  },

  plugins: [react()],
})

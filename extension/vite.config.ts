import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  publicDir: 'public',
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'wagmi', 'viem', '@tanstack/react-query', 'dexie'],
  },
  build: {
    lib: {
      entry: 'src/content.tsx',
      formats: ['iife'],
      name: 'HashChanYT',
      fileName: () => 'content.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    minify: mode === 'production' ? 'esbuild' : false,
    sourcemap: mode !== 'production' ? 'inline' : false,
    assetsInlineLimit: 65536,
  },
  esbuild: {
    charset: 'ascii',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
}))

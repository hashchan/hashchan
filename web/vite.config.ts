import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, '/src')   }],

  },
  define: {
  "process.env.DRAGGABLE_DEBUG": JSON.stringify(process.env.DRAGGABLE_DEBUG ?? false),
  },

  plugins: [react()],
})

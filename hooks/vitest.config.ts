import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globalSetup: './test/globalSetup.ts',
    setupFiles: ['./test/setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Single worker: test files share one anvil node and one account,
    // so parallel execution causes nonce conflicts between files.
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
})

import 'fake-indexeddb/auto'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(async () => {
  // Let in-flight async callbacks (e.g. watchEvent onLogs DB writes) settle
  // before cleanup() unmounts providers and closes the IDB.
  await new Promise(r => setTimeout(r, 400))
  cleanup()
})

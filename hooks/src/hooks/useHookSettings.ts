import { useContext, useState, useEffect, useCallback } from 'react'
import { liveQuery } from 'dexie'
import { IDBContext, type HookSettings, type IndexingStrategy } from '../provider/IDBProvider'

type HookSettingsPatch = {
  indexingStrategy?: IndexingStrategy
  blockRangeLimit?: number
  maxBlockRangeDetected?: number | null
  lastDoctorRunAt?: number | null
}

export const useHookSettings = () => {
  const { db } = useContext(IDBContext)
  const [hookSettings, setHookSettings] = useState<HookSettings | null>(null)

  useEffect(() => {
    if (!db) return
    // Query for whichever row exists rather than assuming a specific id —
    // hookSettings is a singleton by convention, not by auto-increment value.
    const subscription = liveQuery(() => db.hookSettings.toCollection().first()).subscribe({
      next: (s) => setHookSettings(s ?? null),
      error: console.error,
    })
    return () => subscription.unsubscribe()
  }, [db])

  const updateHookSettings = useCallback(
    async (patch: HookSettingsPatch) => {
      if (!db || !hookSettings?.id) return
      await db.hookSettings.update(hookSettings.id, patch)
      // liveQuery subscriber will propagate the update — no manual setHookSettings needed
    },
    [db, hookSettings]
  )

  return { hookSettings, updateHookSettings }
}

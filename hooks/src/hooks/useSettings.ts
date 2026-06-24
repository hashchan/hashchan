import { useContext, useState, useEffect, useCallback } from 'react'
import { liveQuery } from 'dexie'
import { IDBContext, type Settings, type IndexingStrategy } from '../provider/IDBProvider'

type SettingsPatch = {
  indexingStrategy?: IndexingStrategy
  blockRangeLimit?: number
}

export const useSettings = () => {
  const { db } = useContext(IDBContext)
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    if (!db) return
    const subscription = liveQuery(() => db.settings.get(1)).subscribe({
      next: (s) => setSettings(s ?? null),
      error: console.error,
    })
    return () => subscription.unsubscribe()
  }, [db])

  const updateSettings = useCallback(
    async (patch: SettingsPatch) => {
      if (!db || !settings) return
      await db.settings.update(1, patch)
      // liveQuery subscriber will propagate the update — no manual setSettings needed
    },
    [db, settings]
  )

  return { settings, updateSettings }
}

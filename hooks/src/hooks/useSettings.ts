import { useContext, useState, useEffect, useCallback } from 'react'
import { liveQuery } from 'dexie'
import { IDBContext, type Settings } from '../provider/IDBProvider'

type SettingsPatch = {
  tosAccepted?: boolean
  tosTimestamp?: number
  defaultTipAmount?: string
}

export const useSettings = () => {
  const { db } = useContext(IDBContext)
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    if (!db) return
    // Query for whichever row exists rather than assuming id 1 — settings is a
    // singleton by convention, not by a guaranteed auto-increment value.
    const subscription = liveQuery(() => db.settings.toCollection().first()).subscribe({
      next: (s) => setSettings(s ?? null),
      error: console.error,
    })
    return () => subscription.unsubscribe()
  }, [db])

  const updateSettings = useCallback(
    async (patch: SettingsPatch) => {
      if (!db || !settings?.id) return
      await db.settings.update(settings.id, patch)
      // liveQuery subscriber will propagate the update — no manual setSettings needed
    },
    [db, settings]
  )

  return { settings, updateSettings }
}

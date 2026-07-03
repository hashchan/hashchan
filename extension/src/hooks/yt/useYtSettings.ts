const KEY = 'hashchan_yt_settings'

export interface YtSettings {
  chainId: number
  boardId: number
}

export const getYtSettings = (): YtSettings | null => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed.chainId === 'number' && typeof parsed.boardId === 'number') {
      return parsed as YtSettings
    }
    return null
  } catch {
    return null
  }
}

export const saveYtSettings = (settings: YtSettings): void => {
  localStorage.setItem(KEY, JSON.stringify(settings))
}

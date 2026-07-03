export type SiteId = 'youtube' | 'wikipedia' | 'rottentomatoes'

export interface SiteSettings {
  chainId: number
  boardId: number
}

const KEYS: Record<SiteId, string> = {
  youtube: 'hashchan_yt_settings',         // keep existing key
  wikipedia: 'hashchan_wiki_settings',
  rottentomatoes: 'hashchan_rt_settings',
}

export const getSiteSettings = (siteId: SiteId): SiteSettings | null => {
  try {
    const raw = localStorage.getItem(KEYS[siteId])
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed.chainId === 'number' && typeof parsed.boardId === 'number') {
      return parsed as SiteSettings
    }
    return null
  } catch {
    return null
  }
}

export const saveSiteSettings = (siteId: SiteId, settings: SiteSettings): void => {
  localStorage.setItem(KEYS[siteId], JSON.stringify(settings))
}

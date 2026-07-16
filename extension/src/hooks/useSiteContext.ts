import type { SiteId } from './useSiteSettings'
import { useYtContext } from './yt/useYtContext'
import { useWikiContext } from './wiki/useWikiContext'
import { useRtContext } from './rt/useRtContext'
import { useRedditContext } from './reddit/useRedditContext'
import { useXContext } from './x/useXContext'

export type { SiteId }

export interface SiteContext {
  siteId: SiteId
  pageId: string
  title: string
  thumbnail: string
  secondaryLabel?: string
  pageUrl: string
}

export const getPageUrl = (siteId: SiteId, pageId: string): string => {
  switch (siteId) {
    case 'youtube': return `https://www.youtube.com/watch?v=${pageId}`
    case 'wikipedia': return `https://en.wikipedia.org/wiki/${encodeURIComponent(pageId)}`
    case 'rottentomatoes': return `https://www.rottentomatoes.com/m/${pageId}`
    case 'reddit': return `https://www.reddit.com/comments/${pageId}/`
    case 'x': return `https://x.com/i/status/${pageId}`
  }
}

export const useSiteContext = (): SiteContext | null => {
  const yt = useYtContext()
  const wiki = useWikiContext()
  const rt = useRtContext()
  const reddit = useRedditContext()
  const x = useXContext()
  return yt ?? wiki ?? rt ?? reddit ?? x ?? null
}

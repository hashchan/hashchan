import { useState, useEffect } from 'react'
import type { SiteContext } from '../useSiteContext'

const getPageId = () => {
  const match = window.location.pathname.match(/^\/wiki\/(.+)$/)
  return match ? decodeURIComponent(match[1]) : ''
}

const getTitle = () =>
  (document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content ?? '')
    .replace(/ - Wikipedia$/, '')
  || document.title.replace(/ - Wikipedia$/, '')

export const useWikiContext = (): SiteContext | null => {
  const [pageId, setPageId] = useState(getPageId)
  const [title, setTitle] = useState(getTitle)

  useEffect(() => {
    const handler = () => {
      setPageId(getPageId())
      setTitle(getTitle())
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  if (!pageId) return null

  const thumbnail = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content ?? ''
  const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(pageId)}`

  return {
    siteId: 'wikipedia',
    pageId,
    title: title || pageId.replace(/_/g, ' '),
    thumbnail,
    pageUrl,
  }
}

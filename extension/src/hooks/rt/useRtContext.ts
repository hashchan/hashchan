import { useState, useEffect } from 'react'
import type { SiteContext } from '../useSiteContext'

const getPageId = () => {
  const match = window.location.pathname.match(/^\/m\/([^/?]+)/)
  return match ? match[1] : ''
}

const getTitle = () =>
  (document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content ?? '')
    .replace(/ - Rotten Tomatoes$/, '')
  || document.title.replace(/ - Rotten Tomatoes$/, '')

export const useRtContext = (): SiteContext | null => {
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
  const pageUrl = `https://www.rottentomatoes.com/m/${pageId}`

  return {
    siteId: 'rottentomatoes',
    pageId,
    title: title || pageId.replace(/_/g, ' '),
    thumbnail,
    pageUrl,
  }
}

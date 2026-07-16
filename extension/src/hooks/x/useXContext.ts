import { useState, useEffect } from 'react'
import type { SiteContext } from '../useSiteContext'

const getPostId = () => {
  const match = window.location.pathname.match(/^\/[^/]+\/status\/(\d+)/)
  return match ? match[1] : ''
}

const getHandle = () => {
  const match = window.location.pathname.match(/^\/([^/]+)\/status\/\d+/)
  return match ? match[1] : ''
}

const stripSuffix = (s: string) => s.replace(/\s*\/\s*X\s*$/, '')

const getTitle = () =>
  stripSuffix(document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content ?? '')
  || stripSuffix(document.title)

export const useXContext = (): SiteContext | null => {
  const [postId, setPostId] = useState(getPostId)
  const [handle, setHandle] = useState(getHandle)
  const [title, setTitle] = useState(getTitle)

  useEffect(() => {
    const handler = () => {
      setPostId(getPostId())
      setHandle(getHandle())
      setTitle(getTitle())
    }
    // x.com is a client-routed SPA with no nav-finish event of its own -
    // 'navigatesuccess' fires once the SPA route transition has committed,
    // so the DOM/meta tags are settled by the time we read them.
    navigation.addEventListener('navigatesuccess', handler)
    return () => navigation.removeEventListener('navigatesuccess', handler)
  }, [])

  if (!postId) return null

  const thumbnail = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content ?? ''
  const pageUrl = `https://x.com/${handle}/status/${postId}`

  return {
    siteId: 'x',
    pageId: postId,
    title: title || postId,
    thumbnail,
    secondaryLabel: handle ? `@${handle}` : undefined,
    pageUrl,
  }
}

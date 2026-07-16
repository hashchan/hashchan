import { useState, useEffect } from 'react'
import type { SiteContext } from '../useSiteContext'

const getPostId = () => {
  const match = window.location.pathname.match(/^\/r\/[^/]+\/comments\/([^/]+)/)
  return match ? match[1] : ''
}

const getSubreddit = () => {
  const match = window.location.pathname.match(/^\/r\/([^/]+)/)
  return match ? match[1] : ''
}

const stripSuffix = (s: string) => s.replace(/\s*:\s*r\/\S+\s*$/, '')

const getTitle = () =>
  stripSuffix(document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content ?? '')
  || stripSuffix(document.title)

export const useRedditContext = (): SiteContext | null => {
  const [postId, setPostId] = useState(getPostId)
  const [subreddit, setSubreddit] = useState(getSubreddit)
  const [title, setTitle] = useState(getTitle)

  useEffect(() => {
    const handler = () => {
      setPostId(getPostId())
      setSubreddit(getSubreddit())
      setTitle(getTitle())
    }
    // Reddit is a client-routed SPA with no nav-finish event of its own —
    // 'navigatesuccess' fires once the SPA route transition has committed,
    // so the DOM/meta tags are settled by the time we read them.
    navigation.addEventListener('navigatesuccess', handler)
    return () => navigation.removeEventListener('navigatesuccess', handler)
  }, [])

  if (!postId) return null

  const thumbnail = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content ?? ''
  const pageUrl = `https://www.reddit.com/r/${subreddit}/comments/${postId}/`

  return {
    siteId: 'reddit',
    pageId: postId,
    title: title || postId,
    thumbnail,
    secondaryLabel: subreddit ? `r/${subreddit}` : undefined,
    pageUrl,
  }
}

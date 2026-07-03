import { useState, useEffect } from 'react'
import type { SiteContext } from '../useSiteContext'

const getVideoId = () =>
  new URLSearchParams(window.location.search).get('v') ?? ''

const getVideoTitle = () =>
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content
  ?? document.title.replace(/ - YouTube$/, '')
  ?? ''

const getVideoChannel = () =>
  document.querySelector<HTMLAnchorElement>('ytd-channel-name yt-formatted-string a')?.textContent?.trim()
  ?? document.querySelector<HTMLAnchorElement>('#channel-name a')?.textContent?.trim()
  ?? ''

export const useYtContext = (): SiteContext | null => {
  const [videoId, setVideoId] = useState(getVideoId)
  const [title, setTitle] = useState(getVideoTitle)
  const [channel, setChannel] = useState(getVideoChannel)

  useEffect(() => {
    const handler = () => {
      setVideoId(getVideoId())
      setTitle(getVideoTitle())
      setChannel(getVideoChannel())
    }
    document.addEventListener('yt-navigate-finish', handler)
    return () => document.removeEventListener('yt-navigate-finish', handler)
  }, [])

  if (!videoId) return null

  const thumbnail = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content ?? ''
  const pageUrl = `https://www.youtube.com/watch?v=${videoId}`

  return {
    siteId: 'youtube',
    pageId: videoId,
    title: title || videoId,
    thumbnail,
    secondaryLabel: channel ? `@${channel}` : undefined,
    pageUrl,
  }
}

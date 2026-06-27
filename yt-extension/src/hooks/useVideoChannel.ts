import { useState, useEffect } from 'react'

const getVideoChannel = () =>
  document.querySelector<HTMLMetaElement>('meta[itemprop="channelId"]')
    ?.closest('[itemscope]')
    ?.querySelector<HTMLMetaElement>('meta[itemprop="name"]')?.content
  ?? document.querySelector<HTMLAnchorElement>('ytd-channel-name yt-formatted-string a')?.textContent?.trim()
  ?? document.querySelector<HTMLAnchorElement>('#channel-name a')?.textContent?.trim()
  ?? ''

export const useVideoChannel = () => {
  const [channel, setChannel] = useState(getVideoChannel)

  useEffect(() => {
    const handler = () => setChannel(getVideoChannel())
    document.addEventListener('yt-navigate-finish', handler)
    return () => document.removeEventListener('yt-navigate-finish', handler)
  }, [])

  return channel
}

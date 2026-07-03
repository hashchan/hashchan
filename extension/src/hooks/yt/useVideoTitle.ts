import { useState, useEffect } from 'react'

const getVideoTitle = () =>
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content
  ?? document.title.replace(/ - YouTube$/, '')
  ?? ''

export const useVideoTitle = () => {
  const [title, setTitle] = useState(getVideoTitle)

  useEffect(() => {
    const handler = () => setTitle(getVideoTitle())
    document.addEventListener('yt-navigate-finish', handler)
    return () => document.removeEventListener('yt-navigate-finish', handler)
  }, [])

  return title
}

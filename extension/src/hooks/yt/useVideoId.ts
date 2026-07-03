import { useState, useEffect } from 'react'

const getVideoId = () =>
  new URLSearchParams(window.location.search).get('v') ?? ''

export const useVideoId = () => {
  const [videoId, setVideoId] = useState(getVideoId)

  useEffect(() => {
    const handler = () => setVideoId(getVideoId())
    document.addEventListener('yt-navigate-finish', handler)
    return () => document.removeEventListener('yt-navigate-finish', handler)
  }, [])

  return videoId
}

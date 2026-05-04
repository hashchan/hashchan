import { useState, useEffect, useCallback } from 'react'
import { useHelia } from '@/hooks/p2p/useHelia'
import { FailedMediaDiv } from '@/components/FailedMediaDiv'

// Whitelist of allowed MIME types for security
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/x-matroska' // MKV format
]

export const ImageDiv = ({imgUrl}: {imgUrl: string}) => {
  //imgUrl = 'bafkreiab6xxyrrnitmrukgeh5kwvnyhidhxsdmuloyeft7omycpk2vauwu'
  const [uri, setUri] = useState(null)
  const { fetchCID } = useHelia()
  const [expanded, setExpanded] = useState(false)
  const [isVideo, setIsVideo] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [imgError, setImgError] = useState(false)

  const handleImageError = (e) => {
    console.log('image error', e)
    console.log('image error')
    setImgError(true)
    setIsVideo(true)
  }
  const handleVideoError = (e) => {
    console.log('video error', e)
    setIsVideo(false);
    setVideoError(true);
  };

  const handleFetchCID = useCallback(async (cid) => {
    console.log('Fetching CID:', cid)
    const {blob, type}  = await fetchCID(cid)
    console.log('blob', blob, 'type', type)
    
    // Security: Block non-whitelisted file types (SVG, PDF, etc)
    if (!ALLOWED_TYPES.includes(type)) {
      console.warn(`File type ${type} is blocked for security reasons (not in whitelist)`)
      setImgError(true)
      setVideoError(true)
      return
    }
    
    // Set video flag based on MIME type
    if (type?.startsWith('video/')) {
      setIsVideo(true)
    }
    
    try {
      setUri(URL.createObjectURL(blob))
    } catch (e) {
      console.log(e)
      setUri(null)
    }
  }, [fetchCID])

  const handleFetchHTTPS = useCallback(async (url) => {
    try {
      console.log('Fetching HTTPS URL:', url)
      const response = await fetch(url)
      const contentType = response.headers.get('content-type')?.split(';')[0].trim()
      
      console.log('HTTPS content type:', contentType)
      
      // Security: Block non-whitelisted file types
      if (!ALLOWED_TYPES.includes(contentType)) {
        console.warn(`HTTPS file type ${contentType} is blocked for security reasons (not in whitelist)`)
        setImgError(true)
        setVideoError(true)
        return
      }
      
      // Set video flag based on MIME type
      if (contentType?.startsWith('video/')) {
        setIsVideo(true)
      }
      
      const blob = await response.blob()
      setUri(URL.createObjectURL(blob))
    } catch (e) {
      console.error('Failed to fetch HTTPS URL:', e)
      setImgError(true)
      setVideoError(true)
    }
  }, [])

  useEffect(() => {
    const https = /^https?:\/\//;
    if (!https.test(imgUrl)) {
      console.log('imgUrl', imgUrl)
      handleFetchCID(imgUrl)
    } else {
      handleFetchHTTPS(imgUrl)
    }
  }, [handleFetchCID, handleFetchHTTPS, imgUrl])

  if (videoError && imgError) {
    console.log('videoError', videoError)
    console.log('imgError', imgError)
    // Render placeholder to maintain post alignment
    return <FailedMediaDiv />
  }

  if (isVideo || imgError) {
    return (
      <video
        src={uri}
        style={{
          float: 'left',
          justifyContent: 'center',
          objectFit: 'contain',
          paddingRight: `${1/ Math.PHI}vw`,
          minHeight: `${100*(Math.PHI - 1)}px`,
          width: `${100*(Math.PHI + 1)}px`,
          maxHeight: `${1000/(Math.PHI**3)}px`,
        }}
        preload="metadata"
        controls
        playsInline
        onError={handleVideoError}
      />
    )
  }
  return (
    <img 
      onClick={() => setExpanded(!expanded)}
      style={{
        float: 'left',
        justifyContent: 'center',
        objectFit: 'contain',
        paddingRight: `${1/ Math.PHI}vw`,
        minHeight: `${100*(Math.PHI - 1)}px`,
        width: expanded ? `${(100/(Math.PHI))+(100/(Math.PHI**3))+(100/(Math.PHI**5))}vw` : `${100*(Math.PHI + 1)}px`,
        maxHeight: expanded ? `${(100/(Math.PHI))+(100/(Math.PHI**3))+(100/(Math.PHI**5))}vh` : `${1000/(Math.PHI**3)}px`,
      }}
      src={uri}
      onError={handleImageError}
    />
  )
}

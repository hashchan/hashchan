import { useState, useEffect, useCallback } from 'react'
import { useHelia } from '@/hooks/p2p/useHelia'
import { useKubo } from '@/hooks/useKubo'
import { useKuboFetch } from '@/hooks/useKuboFetch'
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
  const { connected: kuboConnected, creds: kuboCreds } = useKubo()
  const { fetchCID: fetchCIDViaKubo } = useKuboFetch()
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

  // Fetch strategy for a bare CID, in order: the in-browser Helia/libp2p
  // node first (websockets/webRTC/webTransport/circuit-relay — see
  // HeliaProvider.tsx), then fall back to a connected Kubo node's own
  // /api/v0/cat if that misses. A real Kubo node has full TCP/QUIC/DHT
  // connectivity the browser can never have, so it can reach CIDs the
  // in-browser node can't — this is the well-known JS-libp2p/Kubo network
  // fragmentation problem, not a bug in either side.
  const handleFetchCID = useCallback(async (cid) => {
    let { blob, type } = await fetchCID(cid)

    if (!blob && kuboConnected) {
      console.log('Helia fetch missed, falling back to Kubo:', cid)
      ;({ blob, type } = await fetchCIDViaKubo(cid, kuboCreds))
    }
    console.log('blob', blob, 'type', type)

    // Security: Block non-whitelisted file types (SVG, PDF, etc)
    if (!blob || !ALLOWED_TYPES.includes(type)) {
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
  }, [fetchCID, kuboConnected, kuboCreds, fetchCIDViaKubo])

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
    if (!imgUrl) return
    const https = /^https?:\/\//;
    if (!https.test(imgUrl)) {
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

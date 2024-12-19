import { useState, useEffect, useCallback } from 'react'
import { useHelia } from '@/hooks/p2p/useHelia'
export const ImageDiv = ({imgUrl}: {imgUrl: string}) => {
  //imgUrl = 'bafkreiab6xxyrrnitmrukgeh5kwvnyhidhxsdmuloyeft7omycpk2vauwu'
  const [uri, setUri] = useState(null)
  const { fetchCID, logErrors:heliaLogErrors } = useHelia()
  const [protocol, setProtocol] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [isVideo, setIsVideo] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [imgError, setImgError] = useState(false)

  const handleImageError = () => {
    setImgError(true)
    setIsVideo(true)
  }
  const handleVideoError = () => {
    setIsVideo(false);
    setVideoError(true);
  };

  const handleFetchCID = useCallback(async (cid) => {
    const {blob, type}  = await fetchCID(cid)
    console.log('blob', blob)
    try {
      setUri(URL.createObjectURL(blob))
    } catch (e) {
      console.log(e)
      setUri(null)
    }
  }, [fetchCID])

  useEffect(() => {
    const https = /^https?:\/\//;
    if (!https.test(imgUrl)) {
      console.log('imgUrl', imgUrl)
      handleFetchCID(imgUrl)
    } else {
      setUri(imgUrl)
    }
  }, [handleFetchCID, imgUrl])

  if (videoError && imgError) {
    return (<></>)
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
          maxWidth: `${100*(Math.PHI + 1)}px`,
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
        maxWidth: expanded ? `${(100/(Math.PHI))+(100/(Math.PHI**3))+(100/(Math.PHI**5))}vw` : `${100*(Math.PHI + 1)}px`,
        maxHeight: expanded ? `${(100/(Math.PHI))+(100/(Math.PHI**3))+(100/(Math.PHI**5))}vh` : `${1000/(Math.PHI**3)}px`,
      }}
      src={uri}
      onError={handleImageError}
    />
  )
}

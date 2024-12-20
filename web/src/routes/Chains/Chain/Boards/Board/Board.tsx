import { Fragment, useState, useEffect, useCallback } from 'react'

import { useHelia } from '@/hooks/p2p/useHelia'
import { BoardHeader } from '@/components/BoardHeader'
import { useBoard } from '@/hooks/HashChan/useBoard'


const Banner = ({
  bannerUrl,
  bannerCID
}:{
  bannerUrl: string | null,
  bannerCID: string | null
}) => {
  const { fetchCID, logErrors } = useHelia()
  const [imgError, setImgError] = useState(false)
  const [uri, setURI] = useState(bannerUrl)
  const [expanded, setExpanded] = useState(false)
  const phi1 = 100/(Math.PHI)
  const phi2 = 100/(Math.PHI**2)
  const phi3 = 100/(Math.PHI**3)
  const handleImageError = () => {
    setImgError(true)
  }

  const handleFetchCID = useCallback(async (cid) => {
    const {blob, type}  = await fetchCID(cid)
    setURI(URL.createObjectURL(blob))
  }, [fetchCID])

  useEffect(() => {
    handleFetchCID(bannerCID)
  },[handleFetchCID, bannerCID, imgError])



  return (
    <img
      src={uri}
      style={{
        maxWidth: expanded ? `${phi1+phi3}vw` : (`${phi2}vw`),
        maxHeight: expanded ? `${phi1+phi3}vh` : (`${phi2}vh`),
      }}
      onClick={() => setExpanded(!expanded)}
      onError={handleImageError}
    />
  )
}

export const Board = () => {
  const { board } = useBoard()


  useEffect(() => {
    console.log('board::board', board)
  }, [board])



  // Check if we're at the exact board route
  return (
    <Fragment key={`board-${board?.boardId}`}>
      <BoardHeader />
        <>
          <div
            className="flex-wrap-center"
            style={{
              flexDirection: 'column',
            }}
          >
            <Banner bannerUrl={board?.bannerUrl} bannerCID={board?.bannerCID} />
            <div>
              <h3>Description</h3>
              <p>{board?.description}</p>
              <br/>
              <h3>Rules</h3>
              {board?.rules.map((rule, i) => {
                return (<p key={i}> - {rule}</p>)
              })}
            </div>
          </div>
        </>
    </Fragment>
  )
}

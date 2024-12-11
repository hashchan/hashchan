import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useParams, Outlet, useLocation } from 'react-router-dom'
import { CreateThread } from '@/components/CreateThread'
import { CreatePost } from '@/components/CreatePost'
import { useAccount } from 'wagmi'

import { useHelia } from '@/hooks/p2p/useHelia'

import { useBoard } from '@/hooks/HashChan/useBoard'

const PostButton = ({
  threadId,
  address,
  chain,
  handleClose
}:{
  threadId: string | null,
  address: string | null,
  chain: number | null,
  handleClose: () => void
}) => {
  if (!address) {
    return (<p>Please connect a wallet to get started</p>)
  }

  if (!chain) {
    return (<p>Please connect to a supported chain</p>)
  }


  return (
    <button
      onClick={handleClose}
    >
      {threadId ? "Make Post" : "Make Thread"}
    </button>
  )
}

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
  const { address, chain } = useAccount()
  const { board } = useBoard()
  const { chainId, boardId, threadId } = useParams()
  const [openMakeContent, setOpenMakeContent] = useState(false)
  const location = useLocation()

  const handleClose = () => {
    setOpenMakeContent(!openMakeContent)
  }

  useEffect(() => {
    console.log('board::board', board)
  }, [board])

  // Check if we're at the exact board route
  const isExactBoardRoute = location.pathname === `/chains/${chainId}/boards/${boardId}`

  return (
    <>
      <div
        className="flex-wrap-center"
        style={{
          marginTop: '0',
          justifyContent: 'space-between'
        }}>
        { board && (
          <h2>
            <Link to={`/chains/${chainId}/boards/${boardId}`}>
              /{board.symbol}/
            </Link>
          </h2>
        )}
        <PostButton
          threadId={threadId}
          address={address}
          chain={chain?.id}
          handleClose={handleClose}
        />
      </div>
      <p>[<Link to={`/chains/${chainId}/boards/${boardId}/catalogue`}>Catalogue</Link>]</p>

      {openMakeContent && (<>
        { threadId ? (
          <CreatePost threadId={threadId} replyIds={[]} handleClose={handleClose} />
        ): (
        <CreateThread board={board}  handleClose={handleClose}/>
        )}
        </>)
      }
      { isExactBoardRoute ? (
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
      ) : (
        <Outlet />
      )}
    </>
  )
}

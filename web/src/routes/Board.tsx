import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useParams, Outlet } from 'react-router-dom'
import { CreateThread } from '@/components/CreateThread'
import { CreatePost } from '@/components/CreatePost'
import { useAccount } from 'wagmi'

import { useBoard } from '@/hooks/useBoard'

export const Board = () => {
  const { address, chain } = useAccount()
  const { board } = useBoard()
  const { chainId, boardId, threadId } = useParams()
  const [openMakeContent, setOpenMakeContent] = useState(false)
  const handleClose = () => {
    setOpenMakeContent(!openMakeContent)
  }
  return (
    <>
      <div
        className="flex-wrap-center"
        style={{
        marginTop: '0',
        justifyContent: 'space-between'
        }}>
        { board && (
          <h2><Link to={`/chains/${chainId}/boards/${boardId}`}>/{board.symbol}/</Link></h2>
        )}
        { address ? (<> { chain ? (
          <button  onClick={() => {
            setOpenMakeContent(!openMakeContent)
          }}>{threadId ? "Make Post" : "Make Thread"}</button>
        ):(
          <p>Please connect to a supported chain</p>
        ) 
          }
        </>) : (
          <p>please connect a wallet to post</p>
        )
        }
      </div>
      <p>[<Link to={`/chains/${chainId}/boards/${boardId}/catalogue`}>Catalogue</Link>]</p>
      
      {openMakeContent && (<>
        { threadId ? (
          <div style={{
            width: '85.4vw',
            margin: '0 auto',
          }}>
          <CreatePost threadId={threadId} replyIds={[]} handleClose={handleClose} />
          </div>
        ): (
        <CreateThread board={board}  handleClose={handleClose}/>
        )
        }
        </>)
      }


      <Outlet />
      </>
  )
}

import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {useAccount} from 'wagmi'
import {useBoard} from '@/hooks/HashChan/useBoard'

import { CreateThread } from '@/components/HashChan/CreateThread'
import { CreatePost } from '@/components/HashChan/CreatePost'

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
export const BoardHeader = () => {
  const {board} = useBoard()
  const { address, chain } =  useAccount()
  const { chainId, boardId, threadId } = useParams()
  const [openMakeContent, setOpenMakeContent] = useState(false)

  const handleClose = () => {
    setOpenMakeContent(!openMakeContent)
  }

  return(
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
      
    </>
  )
}

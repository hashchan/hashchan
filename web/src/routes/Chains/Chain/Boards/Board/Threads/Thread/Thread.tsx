import { useState,  } from 'react'
import { useParams   } from 'react-router-dom'

import { useThread } from '@/hooks/HashChan/useThread'
import { CreatePost } from '@/components/HashChan/CreatePost'
import { ChainSwitchNotification } from '@/components/ChainSwitchNotification'
import { PleaseConnectWallet } from '@/components/PleaseConnectWallet'
import { useAccount } from 'wagmi'

import {BoardHeader} from '@/components/BoardHeader'

import { ReducedModeWarning } from '@/components/ReducedModeWarning'
import { Post } from '@/components/HashChan/Thread/Post'
import { CacheFlusher } from '@/components/CacheFlusher'
import { chainIdToName } from '@/utils/blockchain'

export const Thread = () => {
  const [makeReply, setMakeReply] = useState([])
  const [toggleReply, setToggleReply] = useState(false)
  const {threadId, boardId, chainId: urlChainId } = useParams()
  const { chain } = useAccount()
  const { isConnected } = useAccount()
  const { posts, isReducedMode, isLoading, bookmark } = useThread()

  const handleBookmark = (chainId: string, boardId: string, threadId: string, postId: string) => {
    bookmark({ threadId, postId })
  }

  const handleOpenPost = (threadId:string) => {
    setMakeReply(old => [...old, threadId])
    setToggleReply(true)
  }
  const handleClose = () => {
    setToggleReply(!toggleReply)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isConnected) {
    return (
      <>
        <PleaseConnectWallet />
      </>
    )
  }

  return (
    <>
      <ChainSwitchNotification />
      <BoardHeader key={`board-${boardId}-${threadId}`} />
      {toggleReply && (<CreatePost threadId={threadId} replyIds={makeReply} handleClose={handleClose} />)}
      {isReducedMode && <ReducedModeWarning />}
      <h3 style={{wordWrap: 'break-word'}}>Thread {threadId}</h3>
      {posts && posts.map((post, i) => {
        return (
          <Post
            key={i}
            creator={post?.creator as `0x${string}`}
            postId={i === 0 ? post?.threadId:post?.postId}
            imgUrl={post?.imgUrl}
            content={post?.content}
            timestamp={post?.timestamp}
            replies={post?.replies}
            bookmarked={post?.bookmarked}
            handleOpenPost={handleOpenPost}
            ref={post?.ref}
            janitoredBy={post?.janitoredBy}
            bookmark={handleBookmark}
          />
        )
      })
      }
      {posts.length === 0 && (
        <>
          <p>Think there should be something here? try flushing the cache</p>
          <p>This thread is on the {chainIdToName(Number(urlChainId))}</p>
          <p>Current chain is {chain.name}</p>
          <CacheFlusher
            query={{
              table: "threads",
              where: "threadId",
              equals: threadId
            }}
            handler={() => window.location.reload()}
          />
        </>
      )}
    </>
  )
}

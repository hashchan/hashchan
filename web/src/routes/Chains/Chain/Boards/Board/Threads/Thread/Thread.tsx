import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { FaLink, FaCheck } from 'react-icons/fa6'

import { useThread } from '@/hooks/HashChan/useThread'
import { useReverseChunkedPostCursor } from '@/hooks/HashChan/useReverseChunkedPostCursor'
import { CreatePost } from '@/components/HashChan/CreatePost'
import { ChainSwitchNotification } from '@/components/ChainSwitchNotification'
import { PleaseConnectWallet } from '@/components/PleaseConnectWallet'
import { useAccount } from 'wagmi'

import { BoardHeader } from '@/components/BoardHeader'
import { ReverseChunkedCursor } from '@/components/ReverseChunkedCursor'
import { ForwardChunkedCursor } from '@/components/ForwardChunkedCursor'
import { ScanMap } from '@/components/HashChan/ScanMap'
import { ReducedModeWarning } from '@/components/ReducedModeWarning'
import { Post } from '@/components/HashChan/Thread/Post'
import { CacheFlusher } from '@/components/CacheFlusher'
import { chainIdToName } from '@/utils/blockchain'

export const Thread = () => {
  const [makeReply, setMakeReply] = useState([])
  const [toggleReply, setToggleReply] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const {threadId, boardId, chainId: urlChainId } = useParams()
  const { chain } = useAccount()
  const { isConnected } = useAccount()
  const { posts, janitoredMap, isReducedMode, isLoading, bookmark } = useThread()
  const cursor = useReverseChunkedPostCursor()

  // posts[0] is always the thread itself (see the postId={i === 0 ? ...}
  // logic below) — its blockCreatedAt is what a shared link anchors on, so a
  // reverseChunked recipient can jump straight there instead of the bootstrap
  // lookup blindly searching a recent window before tip. Pairing it with
  // toBlock — the chain tip as of right now, i.e. as far as *this* client has
  // possibly synced — gives the recipient both ends of a bounded range, so
  // their forward scan can grab everything in one shot instead of clicking
  // "scan forward" repeatedly toward a moving target.
  const threadBlockCreatedAt = posts[0]?.blockCreatedAt
  const handleCopyLink = () => {
    if (threadBlockCreatedAt == null) return
    const params = new URLSearchParams({ atBlock: String(threadBlockCreatedAt) })
    if (cursor.blockNumber != null) params.set('toBlock', cursor.blockNumber.toString())
    const url = `${window.location.origin}/chains/${urlChainId}/boards/${boardId}/threads/${threadId}?${params.toString()}`
    navigator.clipboard.writeText(url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

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
      <h3 style={{ wordWrap: 'break-word', display: 'flex', alignItems: 'center', gap: `${1/Math.PHI**2}rem` }}>
        Thread {threadId}
        {threadBlockCreatedAt != null && (
          <button
            className="flex-wrap-center"
            onClick={handleCopyLink}
            title="copy a link to this thread, with the block range a reverseChunked client needs to find it"
            style={{ fontSize: '0.618em' }}
          >
            {linkCopied ? <FaCheck /> : <FaLink />}
          </button>
        )}
      </h3>
      {cursor.isActive && <ReverseChunkedCursor {...cursor} />}
      {cursor.isForwardActive && <ForwardChunkedCursor {...cursor} />}
      {cursor.isActive && <ScanMap {...cursor} />}
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
            janitoredBy={janitoredMap[post?.postId ?? post?.threadId] ? [janitoredMap[post.postId ?? post.threadId]] : []}
            bookmark={handleBookmark}
          />
        )
      })
      }
      {posts.length === 0 && (
        <>
          <p>Think there should be something here? try flushing the cache</p>
          <p>This thread is on the {chainIdToName(Number(urlChainId))}</p>
          <p>Current chain is {chain ? chain.name : 'not a supported chain'}</p>
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

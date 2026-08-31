import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useThread } from '@hashchan/hooks'
import { ReverseChunkedCursor } from './ReverseChunkedCursor'
import { ForwardChunkedCursor } from './ForwardChunkedCursor'
import { ScanMap } from './ScanMap'
import { RpcHint } from './RpcHint'
import { Post } from './Post'
import { PostForm } from './PostForm'
import type { HashchanThreadTarget } from '../utils/hashchanUrl'
import type { PostView } from '@hashchan/hooks'

const φ = Math.PHI

// Displays a thread reached by a pasted hashchan link (ThreadLookup) rather
// than by matching the current page's SiteContext — so, unlike PageThread,
// there's no page to pre-fill a new thread from and no "start discussion"
// affordance; this is purely for viewing/replying to a thread that's already
// known to exist somewhere on-chain.
export const LookedUpThread = ({
  target,
  onClose,
}: {
  target: HashchanThreadTarget
  onClose: () => void
}) => {
  const { chainId, boardId, threadId } = target
  const { isConnected } = useAccount()
  const {
    posts,
    error,
    isLoading,
    strategy,
    fetchHistory,
    canFetchHistory,
    historyBoundary,
    isFullyScanned,
    scanFloor,
    fetchForward,
    canFetchForward,
    forwardBoundary,
    blockNumber,
    scanRange,
    scannedSpans,
    blockRangeLimit,
  } = useThread(boardId, chainId, threadId, target.atBlock, target.toBlock)

  const isForwardActive = target.atBlock != null && strategy === 'reverseChunked' && canFetchForward

  const [showReply, setShowReply] = useState(false)
  const [initialContent, setInitialContent] = useState('')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${1 / φ}em` }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: `${1 / φ ** 2}em`,
        borderBottom: '1px solid #1a1a1a',
      }}>
        <span style={{ fontSize: `${1 / φ}em`, color: '#DF3DF1', fontFamily: 'monospace' }}>
          chain {chainId} · board {boardId}
        </span>
        <button onClick={onClose} style={{ margin: 0, color: '#ff0000' }} title="Back to this page's thread">
          ✕
        </button>
      </div>

      {strategy === 'reverseChunked' && (
        <>
          <ReverseChunkedCursor
            blockNumber={blockNumber}
            historyBoundary={historyBoundary}
            isFullyScanned={isFullyScanned}
            fetchHistory={fetchHistory}
            canFetchHistory={canFetchHistory}
          />
          <ScanMap
            scanFloor={scanFloor}
            blockNumber={blockNumber}
            blockRangeLimit={blockRangeLimit}
            scannedSpans={scannedSpans}
            scanRange={scanRange}
          />
        </>
      )}
      {isForwardActive && (
        <ForwardChunkedCursor
          blockNumber={blockNumber}
          forwardBoundary={forwardBoundary}
          fetchForward={fetchForward}
          canFetchForward={canFetchForward}
        />
      )}

      {error ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${1 / φ ** 2}em` }}>
          <p style={{ color: '#e33', margin: 0 }}>{(error as Error).message}</p>
          <RpcHint />
        </div>
      ) : isLoading ? (
        <p style={{ color: '#fff' }}>Loading posts...</p>
      ) : !posts.length ? (
        <p style={{ color: '#fff' }}>
          No thread found here yet — if this link came with a block range, try scanning forward above.
        </p>
      ) : (
        posts.map((post: PostView, i: number) => (
          <Post
            key={post.postId ?? post.threadId ?? i}
            ref={post.ref as React.RefObject<HTMLDivElement>}
            creator={post.creator as `0x${string}`}
            postId={i === 0 ? (post.threadId ?? '') : (post.postId ?? '')}
            imgUrl={post.imgUrl}
            content={post.content}
            timestamp={post.timestamp}
            replies={post.replies as any}
            onReply={(postId) => {
              const truncated = `${postId.slice(0, 9)}…${postId.slice(-7)}`
              setInitialContent(`[${truncated}](#${postId})\n`)
              setShowReply(true)
            }}
          />
        ))
      )}

      {isConnected && posts.length > 0 && (
        <div>
          <button onClick={() => setShowReply(v => !v)} style={{ width: '100%', margin: 0, textAlign: 'center' }}>
            {showReply ? 'Close' : 'Create Post'}
          </button>
          {showReply && (
            <div style={{ marginTop: `${1 / φ ** 2}em` }}>
              <PostForm
                boardId={boardId}
                chainId={chainId}
                threadId={threadId}
                initialContent={initialContent}
                onClose={() => { setShowReply(false); setInitialContent('') }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

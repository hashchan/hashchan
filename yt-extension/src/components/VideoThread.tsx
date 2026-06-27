import { useState } from 'react'
import { useAccount, useBlockNumber } from 'wagmi'
import { useThreads, useThread, useCreateThread } from '@hashchan/hooks'
import { getYtSettings } from '../hooks/useYtSettings'
import { useVideoTitle } from '../hooks/useVideoTitle'
import { useVideoChannel } from '../hooks/useVideoChannel'
import { Post } from './Post'
import { PostForm } from './PostForm'
import { TxResponse } from './TxResponse'
import { ReverseChunkedCursor } from './ReverseChunkedCursor'
import type { PostView } from '@hashchan/hooks'

export const VideoThread = ({ videoId }: { videoId: string }) => {
  const settings = getYtSettings()

  if (!settings) {
    return (
      <p style={{ color: '#fff' }}>
        No /yt/ board configured — open Settings to get started.
      </p>
    )
  }

  return (
    <BoardView
      key={`${settings.chainId}-${settings.boardId}-${videoId}`}
      boardId={settings.boardId}
      chainId={settings.chainId}
      videoId={videoId}
    />
  )
}

const BoardView = ({
  boardId,
  chainId,
  videoId,
}: {
  boardId: number
  chainId: number
  videoId: string
}) => {
  const { isConnected } = useAccount()
  const { threads, isLoading: threadsLoading, fetchHistory, canFetchHistory, strategy, historyBoundary } = useThreads(boardId, chainId)
  const { data: blockNumber } = useBlockNumber({ watch: true })
  const {
    status: createStatus,
    hash: createHash,
    logs: createLogs,
    logErrors: createLogErrors,
    threadId: newThreadId,
    createThread,
  } = useCreateThread(boardId, chainId)
  const [showReply, setShowReply] = useState(false)
  const [initialContent, setInitialContent] = useState('')

  const videoTitle = useVideoTitle()
  const videoChannel = useVideoChannel()
  const matchThread = threads.find(t => t.title === videoId)
  const activeThreadId = matchThread?.threadId ?? newThreadId ?? ''

  const handleStartDiscussion = () => {
    const url = `https://www.youtube.com/watch?v=${videoId}`
    const content = videoTitle ? `[${videoTitle}](${url})` : url
    const imgUrl = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content ?? ''
    createThread(videoId, imgUrl, content)
  }

  const toggleReply = () => {
    if (showReply) { setShowReply(false); setInitialContent('') }
    else { setInitialContent(''); setShowReply(true) }
  }

  const φ = Math.PHI
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${1 / φ}em` }}>
      {/* header row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: `${1 / φ ** 2}em`,
        borderBottom: '1px solid #1a1a1a',
      }}>
        <div style={{ display: 'flex', gap: `${1 / φ ** 2}em`, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span style={{ fontSize: `${1 / φ}em`, color: '#fff', fontFamily: 'monospace' }}>
            {videoId}
          </span>
          {videoChannel && (
            <span style={{ fontSize: `${1 / φ}em`, color: '#DF3DF1', fontFamily: 'monospace' }}>
              @{videoChannel}
            </span>
          )}
        </div>
        {isConnected && activeThreadId && (
          <button
            onClick={toggleReply}
            style={{ margin: 0, padding: `${1 / φ ** 3}em ${1 / φ ** 2}em`, color: showReply ? '#ff0000' : '#20C20E' }}
            title={showReply ? 'Close' : 'Create Post'}
          >
            {showReply ? '✕' : '✚'}
          </button>
        )}
      </div>

      {/* video title */}
      {videoTitle && (
        <h3 style={{
          margin: 0,
          fontSize: `1em`,
          fontWeight: 600,
          color: '#fff',
          lineHeight: φ,
          borderBottom: '1px solid #1a1a1a',
          paddingBottom: `${1 / φ ** 2}em`,
        }}>
          {videoTitle}
        </h3>
      )}

      {isConnected && strategy === 'reverseChunked' && (
        <ReverseChunkedCursor
          blockNumber={blockNumber}
          historyBoundary={historyBoundary}
          fetchHistory={fetchHistory}
          canFetchHistory={canFetchHistory}
        />
      )}

      {!isConnected ? (
        <p style={{ color: '#fff' }}>Connect wallet to start.</p>
      ) : threadsLoading ? (
        <p style={{ color: '#fff' }}>Syncing threads...</p>
      ) : !matchThread && !newThreadId ? (
        <NoThread
          createStatus={createStatus}
          createHash={createHash}
          createLogs={createLogs}
          createLogErrors={createLogErrors}
          onStart={handleStartDiscussion}
        />
      ) : null}

      {activeThreadId && (
        <ThreadDisplay
          boardId={boardId}
          chainId={chainId}
          threadId={activeThreadId}
          isConnected={isConnected}
          showReply={showReply}
          initialContent={initialContent}
          onToggleReply={toggleReply}
          onReply={(postId) => {
            const truncated = `${postId.slice(0, 9)}…${postId.slice(-7)}`
            setInitialContent(`[${truncated}](#${postId})\n`)
            setShowReply(true)
          }}
          onCloseReply={() => { setShowReply(false); setInitialContent('') }}
        />
      )}
    </div>
  )
}

const NoThread = ({
  createStatus,
  createHash,
  createLogs,
  createLogErrors,
  onStart,
}: {
  createStatus: string
  createHash: string | null
  createLogs: any[]
  createLogErrors: string[]
  onStart: () => void
}) => {
  const busy = createStatus === 'submitting' || createStatus === 'pending'
  const waitLevel = createStatus === 'submitting' ? 1
    : createStatus === 'pending' ? 2
    : createStatus === 'confirmed' ? 3
    : 0

  return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <p style={{ marginBottom: `${1 / Math.PHI}em`, color: '#fff' }}>
        No thread yet for this video.
      </p>
      <button onClick={onStart} disabled={busy} style={{ margin: 0 }}>
        {busy ? 'Starting...' : 'Start Thread'}
      </button>
      {waitLevel > 0 && (
        <TxResponse
          wait={waitLevel}
          hash={createHash ?? ''}
          logs={createLogs}
          logErrors={createLogErrors}
        />
      )}
    </div>
  )
}

const ThreadDisplay = ({
  boardId,
  chainId,
  threadId,
  isConnected,
  showReply,
  initialContent,
  onToggleReply,
  onReply,
  onCloseReply,
}: {
  boardId: number
  chainId: number
  threadId: string
  isConnected: boolean
  showReply: boolean
  initialContent: string
  onToggleReply: () => void
  onReply: (postId: string) => void
  onCloseReply: () => void
}) => {
  const { posts, isLoading } = useThread(boardId, chainId, threadId)

  if (isLoading) return <p style={{ color: '#fff' }}>Loading posts...</p>

  const φ = Math.PHI
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${1 / φ}em` }}>
      {posts && posts.map((post: PostView, i: number) => (
        <Post
          key={post.postId ?? post.threadId ?? i}
          creator={post.creator as `0x${string}`}
          postId={i === 0 ? (post.threadId ?? '') : (post.postId ?? '')}
          imgUrl={post.imgUrl}
          content={post.content}
          timestamp={post.timestamp}
          onReply={onReply}
        />
      ))}
      {isConnected && (
        <div>
          <button onClick={onToggleReply} style={{ width: '100%', margin: 0, textAlign: 'center' }}>
            {showReply ? 'Close' : 'Create Post'}
          </button>
          {showReply && (
            <div style={{ marginTop: `${1 / φ ** 2}em` }}>
              <PostForm
                boardId={boardId}
                chainId={chainId}
                threadId={threadId}
                initialContent={initialContent}
                onClose={onCloseReply}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useThreads, useThread, useCreateThread } from '@hashchan/hooks'
import { getYtSettings } from '../hooks/useYtSettings'
import { Settings } from './Settings'
import { Post } from './Post'
import { PostForm } from './PostForm'
import { TxResponse } from './TxResponse'
import type { PostView } from '@hashchan/hooks'

export const VideoThread = ({ videoId }: { videoId: string }) => {
  const [showSettings, setShowSettings] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const settings = getYtSettings()

  if (!settings || showSettings) {
    return (
      <Settings
        onSave={() => {
          setShowSettings(false)
          setRefreshKey(k => k + 1)
        }}
      />
    )
  }

  return (
    <BoardView
      key={`${settings.chainId}-${settings.boardId}-${videoId}-${refreshKey}`}
      boardId={settings.boardId}
      chainId={settings.chainId}
      videoId={videoId}
      onOpenSettings={() => setShowSettings(true)}
    />
  )
}

const BoardView = ({
  boardId,
  chainId,
  videoId,
  onOpenSettings,
}: {
  boardId: number
  chainId: number
  videoId: string
  onOpenSettings: () => void
}) => {
  const { isConnected } = useAccount()
  const { threads, isLoading: threadsLoading } = useThreads(boardId, chainId)
  const {
    status: createStatus,
    hash: createHash,
    logs: createLogs,
    logErrors: createLogErrors,
    threadId: newThreadId,
    createThread,
  } = useCreateThread(boardId, chainId)

  const matchThread = threads.find(t => t.title === videoId)
  const activeThreadId = matchThread?.threadId ?? newThreadId ?? ''

  const handleStartDiscussion = () => {
    createThread(videoId, '', `Thread for https://youtube.com/watch?v=${videoId}`)
  }

  const φ = Math.PHI
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${1 / φ}em` }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: `${1 / φ ** 2}em`,
        borderBottom: '1px solid #1a1a1a',
      }}>
        <span style={{ fontSize: `${1 / φ}em`, color: '#fff', fontFamily: 'monospace' }}>
          {videoId}
        </span>
        <button
          onClick={onOpenSettings}
          style={{ margin: 0, padding: `${1 / φ ** 3}em ${1 / φ ** 2}em` }}
          title="Settings"
        >
          ⚙
        </button>
      </div>

      {threadsLoading && (
        <p style={{ color: '#fff' }}>Syncing threads...</p>
      )}

      {!threadsLoading && !matchThread && !newThreadId && (
        <NoThread
          videoId={videoId}
          isConnected={isConnected}
          createStatus={createStatus}
          createHash={createHash}
          createLogs={createLogs}
          createLogErrors={createLogErrors}
          onStart={handleStartDiscussion}
        />
      )}

      {activeThreadId && (
        <ThreadDisplay
          boardId={boardId}
          chainId={chainId}
          threadId={activeThreadId}
          isConnected={isConnected}
        />
      )}
    </div>
  )
}

const NoThread = ({
  videoId,
  isConnected,
  createStatus,
  createHash,
  createLogs,
  createLogErrors,
  onStart,
}: {
  videoId: string
  isConnected: boolean
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
      {isConnected ? (
        <>
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
        </>
      ) : (
        <p style={{ color: '#fff' }}>
          Connect wallet to start a thread.
        </p>
      )}
    </div>
  )
}

const ThreadDisplay = ({
  boardId,
  chainId,
  threadId,
  isConnected,
}: {
  boardId: number
  chainId: number
  threadId: string
  isConnected: boolean
}) => {
  const { posts, isLoading } = useThread(boardId, chainId, threadId)
  const [initialContent, setInitialContent] = useState('')
  const [showReply, setShowReply] = useState(false)

  const handleReply = (postId: string) => {
    const truncated = `${postId.slice(0, 9)}…${postId.slice(-7)}`
    setInitialContent(`[${truncated}](#${postId})\n`)
    setShowReply(true)
  }

  if (isLoading) {
    return <p style={{ color: '#fff' }}>Loading posts...</p>
  }

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
          onReply={handleReply}
        />
      ))}
      {isConnected && (
        <div>
          <button
            onClick={() => {
              if (showReply) { setShowReply(false); setInitialContent('') }
              else { setInitialContent(''); setShowReply(true) }
            }}
            style={{ width: '100%', margin: 0, textAlign: 'center' }}
          >
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

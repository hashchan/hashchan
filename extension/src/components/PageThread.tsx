import React, { useState, useEffect } from 'react'
import { useAccount, useBlockNumber } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useThreads, useThread, useCreateThread, useBoards, computeImageCID } from '@hashchan/hooks'
import { getSiteSettings, saveSiteSettings } from '../hooks/useSiteSettings'
import { ReverseChunkedCursor } from './ReverseChunkedCursor'
import { Post } from './Post'
import { PostForm } from './PostForm'
import { TxResponse } from './TxResponse'
import type { SiteContext } from '../hooks/useSiteContext'
import type { PostView } from '@hashchan/hooks'

// Maps each supported site to the board symbol created on-chain for it
const SITE_BOARD_MAP = [
  { siteId: 'youtube'        as const, symbol: 'yt'     },
  { siteId: 'wikipedia'      as const, symbol: 'wiki'   },
  { siteId: 'rottentomatoes' as const, symbol: 'rt'     },
  { siteId: 'reddit'         as const, symbol: 'rdt'    },
  { siteId: 'x'              as const, symbol: 'x'      },
]

export const PageThread = ({ ctx }: { ctx: SiteContext }) => {
  const [settings, setSettings] = useState(() => getSiteSettings(ctx.siteId))
  const { chainId: walletChainId } = useAccount()
  const { boards } = useBoards()

  // Auto-save site settings when boards are found on the connected chain.
  // Only fires when there are no settings yet, or when the wallet switched to a different chain.
  useEffect(() => {
    if (!walletChainId || !boards.length) return
    const current = getSiteSettings(ctx.siteId)
    if (current && current.chainId === walletChainId) return
    for (const { siteId, symbol } of SITE_BOARD_MAP) {
      const board = (boards as any[]).find((b: any) => b.symbol === symbol)
      if (board) saveSiteSettings(siteId, { chainId: walletChainId, boardId: board.boardId })
    }
    setSettings(getSiteSettings(ctx.siteId))
  }, [walletChainId, boards, ctx.siteId])

  if (!settings) {
    return (
      <p style={{ color: '#fff' }}>
        No board configured for this site — open Settings to get started.
      </p>
    )
  }

  return (
    <BoardView
      key={`${settings.chainId}-${settings.boardId}-${ctx.pageId}`}
      boardId={settings.boardId}
      chainId={settings.chainId}
      ctx={ctx}
    />
  )
}

const BoardView = ({
  boardId,
  chainId,
  ctx,
}: {
  boardId: number
  chainId: number
  ctx: SiteContext
}) => {
  const { isConnected, chainId: walletChainId } = useAccount()
  const queryClient = useQueryClient()

  // Invalidate board/thread cache whenever the wallet switches chains so queries re-run
  // against the now-connected network rather than serving stale data.
  useEffect(() => {
    if (!walletChainId) return
    queryClient.invalidateQueries({ queryKey: ['threads', chainId, boardId] })
    queryClient.invalidateQueries({ queryKey: ['board', chainId, boardId] })
  }, [walletChainId])

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

  const matchThread = threads.find(t => t.title === ctx.pageId)
  const activeThreadId = matchThread?.threadId ?? newThreadId ?? ''

  const handleStartDiscussion = async () => {
    const content = `[${ctx.title}](${ctx.pageUrl})`
    // Pre-flight CID check: if the thumbnail can't be fetched (CORS-restricted CDN),
    // fall back to no image rather than blocking thread creation.
    const { error } = await computeImageCID(ctx.thumbnail)
    createThread(ctx.pageId, error ? '' : ctx.thumbnail, content)
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
            {ctx.pageId.length > 24 ? `${ctx.pageId.slice(0, 20)}…` : ctx.pageId}
          </span>
          {ctx.secondaryLabel && (
            <span style={{ fontSize: `${1 / φ}em`, color: '#DF3DF1', fontFamily: 'monospace' }}>
              {ctx.secondaryLabel}
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

      {/* page title */}
      {ctx.title && (
        <h3 style={{
          margin: 0,
          fontSize: '1em',
          fontWeight: 600,
          color: '#fff',
          lineHeight: φ,
          borderBottom: '1px solid #1a1a1a',
          paddingBottom: `${1 / φ ** 2}em`,
        }}>
          {ctx.title}
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
        No thread yet for this page.
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
          ref={post.ref as React.RefObject<HTMLDivElement>}
          creator={post.creator as `0x${string}`}
          postId={i === 0 ? (post.threadId ?? '') : (post.postId ?? '')}
          imgUrl={post.imgUrl}
          content={post.content}
          timestamp={post.timestamp}
          replies={post.replies as any}
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

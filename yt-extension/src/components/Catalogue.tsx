import { useThreads } from '@hashchan/hooks'
import { useBlockNumber } from 'wagmi'
import { getYtSettings } from '../hooks/useYtSettings'
import { ReverseChunkedCursor } from './ReverseChunkedCursor'

const φ = Math.PHI

const truncateId = (id: string) =>
  id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-7)}` : id

const ThreadCard = ({ thread, isCurrentVideo }: { thread: any; isCurrentVideo: boolean }) => {
  const videoId = thread.title
  const videoTitle = thread.content || videoId
  const date = new Date(thread.timestamp * 1000).toLocaleDateString()

  return (
    <div
      onClick={() => { window.location.href = `https://www.youtube.com/watch?v=${videoId}` }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: `${1 / φ ** 2}em`,
        borderBottom: '1px solid #1a1a1a',
        cursor: 'pointer',
        background: isCurrentVideo ? '#20C20E10' : 'transparent',
        borderLeft: isCurrentVideo ? '2px solid #20C20E' : '2px solid transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#20C20E18')}
      onMouseLeave={e => (e.currentTarget.style.background = isCurrentVideo ? '#20C20E10' : 'transparent')}
    >
      <span style={{
        fontWeight: 600,
        color: '#fff',
        lineHeight: φ,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}>
        {videoTitle}
      </span>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: `${1 / φ}em`, color: '#DF3DF1', fontFamily: 'monospace' }}>
          {truncateId(videoId)}
        </span>
        <span style={{ fontSize: `${1 / φ}em`, color: '#fff' }}>{date}</span>
      </div>
    </div>
  )
}

export const Catalogue = ({ currentVideoId }: { currentVideoId: string }) => {
  const settings = getYtSettings()

  if (!settings) {
    return (
      <p style={{ color: '#fff', padding: '8px' }}>
        Configure your /yt/ board in Settings first.
      </p>
    )
  }

  return <CatalogueList boardId={settings.boardId} chainId={settings.chainId} currentVideoId={currentVideoId} />
}

const CatalogueList = ({
  boardId,
  chainId,
  currentVideoId,
}: {
  boardId: number
  chainId: number
  currentVideoId: string
}) => {
  const { threads, isLoading, error, fetchHistory, canFetchHistory, strategy, historyBoundary } = useThreads(boardId, chainId)
  const { data: blockNumber } = useBlockNumber({ watch: true })

  if (isLoading) return <p style={{ color: '#fff', padding: '8px' }}>Syncing threads...</p>
  if (error) return <p style={{ color: '#e33', padding: '8px' }}>{(error as Error).message}</p>

  const sorted = [...threads].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${1 / φ ** 2}em` }}>
      {strategy === 'reverseChunked' && (
        <ReverseChunkedCursor
          blockNumber={blockNumber}
          historyBoundary={historyBoundary}
          fetchHistory={fetchHistory}
          canFetchHistory={canFetchHistory}
        />
      )}
      {!threads.length ? (
        <p style={{ color: '#fff', padding: '8px' }}>No threads yet.</p>
      ) : sorted.map((thread: any) => (
        <ThreadCard
          key={thread.threadId}
          thread={thread}
          isCurrentVideo={thread.title === currentVideoId}
        />
      ))}
    </div>
  )
}

import { useThreads } from '@hashchan/hooks'
import { useBlockNumber } from 'wagmi'
import { getSiteSettings } from '../hooks/useSiteSettings'
import { getPageUrl } from '../hooks/useSiteContext'
import { ReverseChunkedCursor } from './ReverseChunkedCursor'
import type { SiteContext } from '../hooks/useSiteContext'

const φ = Math.PHI

const truncateId = (id: string) =>
  id.length > 20 ? `${id.slice(0, 10)}…${id.slice(-9)}` : id

const ThreadCard = ({
  thread,
  isCurrentPage,
  onClick,
}: {
  thread: any
  isCurrentPage: boolean
  onClick: () => void
}) => {
  const label = thread.content || thread.title
  const date = new Date(thread.timestamp * 1000).toLocaleDateString()

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        padding: `${1 / φ ** 2}em`,
        borderBottom: '1px solid #1a1a1a',
        cursor: 'pointer',
        background: isCurrentPage ? '#20C20E10' : 'transparent',
        borderLeft: isCurrentPage ? '2px solid #20C20E' : '2px solid transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#20C20E18')}
      onMouseLeave={e => (e.currentTarget.style.background = isCurrentPage ? '#20C20E10' : 'transparent')}
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
        {label}
      </span>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: `${1 / φ}em`, color: '#DF3DF1', fontFamily: 'monospace' }}>
          {truncateId(thread.title)}
        </span>
        <span style={{ fontSize: `${1 / φ}em`, color: '#fff' }}>{date}</span>
      </div>
    </div>
  )
}

export const Catalogue = ({ ctx }: { ctx: SiteContext | null }) => {
  const siteId = ctx?.siteId ?? 'youtube'
  const settings = getSiteSettings(siteId)

  if (!settings) {
    return (
      <p style={{ color: '#fff', padding: '8px' }}>
        Configure a board for this site in Settings first.
      </p>
    )
  }

  return (
    <CatalogueList
      boardId={settings.boardId}
      chainId={settings.chainId}
      currentPageId={ctx?.pageId ?? ''}
      siteId={siteId}
    />
  )
}

const CatalogueList = ({
  boardId,
  chainId,
  currentPageId,
  siteId,
}: {
  boardId: number
  chainId: number
  currentPageId: string
  siteId: ReturnType<typeof getSiteSettings> extends null ? never : any
}) => {
  const { threads, isLoading, error, fetchHistory, canFetchHistory, strategy, historyBoundary } = useThreads(boardId, chainId)
  const { data: blockNumber } = useBlockNumber({ watch: true })

  if (isLoading) return <p style={{ color: '#fff', padding: '8px' }}>Syncing threads...</p>
  if (error) return <p style={{ color: '#e33', padding: '8px' }}>{(error as Error).message}</p>

  const sorted = [...threads].sort((a: any, b: any) => b.timestamp - a.timestamp)

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
          isCurrentPage={thread.title === currentPageId}
          onClick={() => { window.location.href = getPageUrl(siteId, thread.title) }}
        />
      ))}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useThreads } from '@hashchan/hooks'
import { useBlockNumber } from 'wagmi'
import { getSiteSettings } from '../hooks/useSiteSettings'
import { getPageUrl } from '../hooks/useSiteContext'
import { ReverseChunkedCursor } from './ReverseChunkedCursor'
import { ScanMap } from './ScanMap'
import { RpcHint } from './RpcHint'
import { ThreadLookup } from './ThreadLookup'
import type { SiteContext } from '../hooks/useSiteContext'
import type { HashchanThreadTarget } from '../utils/hashchanUrl'

const φ = Math.PHI
const SLOW_LOADING_MS = 8000

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

const InvalidPageNotice = () => (
  <div style={{
    padding: `${1 / φ}em`,
    border: '1px dashed #55555550',
    color: '#666',
    fontSize: `${1 / φ}em`,
    textAlign: 'center',
  }}>
    Navigate to a supported page — YouTube, Wikipedia, Rotten Tomatoes, Reddit, X, or GitHub — to see its thread list.
  </div>
)

export const Catalogue = ({
  ctx,
  onLookup,
}: {
  ctx: SiteContext | null
  onLookup: (target: HashchanThreadTarget) => void
}) => {
  const settings = ctx ? getSiteSettings(ctx.siteId) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${1 / φ ** 2}em` }}>
      <ThreadLookup onLookup={onLookup} />
      {!ctx ? (
        <InvalidPageNotice />
      ) : !settings ? (
        <p style={{ color: '#fff', padding: '8px' }}>
          Configure a board for this site in Settings first.
        </p>
      ) : (
        <CatalogueList
          boardId={settings.boardId}
          chainId={settings.chainId}
          currentPageId={ctx.pageId}
          siteId={ctx.siteId}
        />
      )}
    </div>
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
  siteId: SiteContext['siteId']
}) => {
  const { threads, isLoading, error, fetchHistory, canFetchHistory, strategy, historyBoundary, isFullyScanned, scanFloor, scanRange, scannedSpans, blockRangeLimit } = useThreads(boardId, chainId)
  const { data: blockNumber } = useBlockNumber({ watch: true })
  const [tookTooLong, setTookTooLong] = useState(false)

  useEffect(() => {
    if (!isLoading) { setTookTooLong(false); return }
    const timer = setTimeout(() => setTookTooLong(true), SLOW_LOADING_MS)
    return () => clearTimeout(timer)
  }, [isLoading])

  if (isLoading) {
    return (
      <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: `${1 / φ ** 2}em` }}>
        <p style={{ color: '#fff', margin: 0 }}>Syncing threads...</p>
        {tookTooLong && <RpcHint />}
      </div>
    )
  }
  if (error) {
    return (
      <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: `${1 / φ ** 2}em` }}>
        <p style={{ color: '#e33', margin: 0 }}>{(error as Error).message}</p>
        <RpcHint />
      </div>
    )
  }

  const sorted = [...threads].sort((a: any, b: any) => b.timestamp - a.timestamp)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${1 / φ ** 2}em` }}>
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

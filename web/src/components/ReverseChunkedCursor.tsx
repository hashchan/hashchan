const VALUE_COLOR = '#DF3DF1' // complement of #20C20E
const DONE_COLOR = '#20C20E'

interface CursorProps {
  blockNumber: bigint | undefined
  historyBoundary: bigint | null
  scanFloor: bigint | null | undefined
  fetchHistory: () => void
  canFetchHistory: boolean
}

export const ReverseChunkedCursor = ({ blockNumber, historyBoundary, scanFloor, fetchHistory, canFetchHistory }: CursorProps) => {
  const fromBlock = historyBoundary ?? blockNumber

  // Once the earliest known span reaches the floor (thread/board creation
  // block), there's nothing earlier that could possibly exist — "scan
  // backwards" isn't just disabled, it's permanently done. Say so instead of
  // leaving a greyed-out button sitting there implying the state is temporary.
  const fullyScanned = historyBoundary != null && scanFloor != null && historyBoundary <= scanFloor

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: `${1/Math.PHI}vw`,
      marginBottom: `${1/Math.PHI}vh`,
      padding: `${1/Math.PHI**2}vh ${1/Math.PHI}vw`,
      border: '1px solid #20C20E20',
    }}>
      <span>
        scanned{' '}
        <strong style={{ color: VALUE_COLOR }}>
          {fromBlock?.toString() ?? '...'} to {blockNumber?.toString() ?? '...'}
        </strong>
      </span>
      {fullyScanned ? (
        <span style={{ color: DONE_COLOR }}>fully scanned — listening for new posts</span>
      ) : (
        <button
          disabled={!canFetchHistory}
          onClick={fetchHistory}
          style={{ opacity: canFetchHistory ? 1 : 0.4 }}
        >
          scan backwards
        </button>
      )}
    </div>
  )
}

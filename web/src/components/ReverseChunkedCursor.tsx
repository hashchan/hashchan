const VALUE_COLOR = '#DF3DF1' // complement of #20C20E
const DONE_COLOR = '#20C20E'

interface CursorProps {
  blockNumber: bigint | undefined
  historyBoundary: bigint | null
  isFullyScanned: boolean
  fetchHistory: () => void
  canFetchHistory: boolean
}

export const ReverseChunkedCursor = ({ blockNumber, historyBoundary, isFullyScanned, fetchHistory, canFetchHistory }: CursorProps) => {
  const fromBlock = historyBoundary ?? blockNumber

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
      {isFullyScanned ? (
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

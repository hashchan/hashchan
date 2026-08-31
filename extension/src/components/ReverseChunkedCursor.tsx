const φ = Math.PHI
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
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: `${1 / φ ** 2}em`,
      padding: `${1 / φ ** 2}em`,
      border: '1px solid #20C20E20',
      fontSize: `${1 / φ}em`,
    }}>
      <span style={{ color: '#fff' }}>
        scanned{' '}
        <strong style={{ color: VALUE_COLOR }}>
          {fromBlock?.toString() ?? '…'} to {blockNumber?.toString() ?? '…'}
        </strong>
      </span>
      {isFullyScanned ? (
        <span style={{ color: DONE_COLOR }}>fully scanned — listening for new posts</span>
      ) : (
        <button
          disabled={!canFetchHistory}
          onClick={fetchHistory}
          style={{ margin: 0, opacity: canFetchHistory ? 1 : 0.382 }}
        >
          scan backwards
        </button>
      )}
    </div>
  )
}

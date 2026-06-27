const φ = Math.PHI

interface CursorProps {
  blockNumber: bigint | undefined
  historyBoundary: bigint | null
  fetchHistory: () => void
  canFetchHistory: boolean
}

export const ReverseChunkedCursor = ({ blockNumber, historyBoundary, fetchHistory, canFetchHistory }: CursorProps) => (
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
      block <strong style={{ color: '#DF3DF1' }}>{blockNumber?.toString() ?? '…'}</strong>
    </span>
    <span style={{ color: '#20C20E40' }}>|</span>
    <span style={{ color: '#fff' }}>
      scanned to <strong style={{ color: '#DF3DF1' }}>{(historyBoundary ?? blockNumber)?.toString() ?? '…'}</strong>
    </span>
    <span style={{ color: '#20C20E40' }}>|</span>
    <button
      disabled={!canFetchHistory}
      onClick={fetchHistory}
      style={{ margin: 0, opacity: canFetchHistory ? 1 : 0.4 }}
    >
      scan backwards
    </button>
  </div>
)

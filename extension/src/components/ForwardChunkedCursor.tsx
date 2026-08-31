const φ = Math.PHI
const VALUE_COLOR = '#FF8C00' // orange — distinct from ReverseChunkedCursor's #DF3DF1

interface CursorProps {
  blockNumber: bigint | undefined
  forwardBoundary: bigint | null
  fetchForward: () => void
  canFetchForward: boolean
}

export const ForwardChunkedCursor = ({ blockNumber, forwardBoundary, fetchForward, canFetchForward }: CursorProps) => {
  const toBlock = forwardBoundary ?? blockNumber

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: `${1 / φ ** 2}em`,
      padding: `${1 / φ ** 2}em`,
      border: '1px solid #FF8C0020',
      fontSize: `${1 / φ}em`,
    }}>
      <span style={{ color: '#fff' }}>
        scanned forward to{' '}
        <strong style={{ color: VALUE_COLOR }}>
          {toBlock?.toString() ?? '…'}
        </strong>
      </span>
      <button
        disabled={!canFetchForward}
        onClick={fetchForward}
        style={{ margin: 0, opacity: canFetchForward ? 1 : 0.382 }}
      >
        scan forward
      </button>
    </div>
  )
}

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
      alignItems: 'center',
      gap: `${1/Math.PHI}vw`,
      marginBottom: `${1/Math.PHI}vh`,
      padding: `${1/Math.PHI**2}vh ${1/Math.PHI}vw`,
      border: '1px solid #FF8C0020',
    }}>
      <span>
        scanned forward to{' '}
        <strong style={{ color: VALUE_COLOR }}>
          {toBlock?.toString() ?? '...'}
        </strong>
      </span>
      <button
        disabled={!canFetchForward}
        onClick={fetchForward}
        style={{ opacity: canFetchForward ? 1 : 0.4 }}
      >
        scan forward
      </button>
    </div>
  )
}

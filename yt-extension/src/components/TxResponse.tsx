export const TxResponse = ({
  wait,
  hash,
  logs,
  logErrors,
}: {
  wait: number
  hash: string
  logs: any[]
  logErrors: string[]
}) => {
  if (wait === 0 && logErrors.length === 0) return null
  return (
    <div style={{ fontSize: '0.8em', marginTop: '4px', lineHeight: 1.4 }}>
      {wait === 1 && <p style={{ color: '#fff' }}>Waiting for wallet confirmation...</p>}
      {wait >= 2 && hash && (
        <p style={{ color: '#fff' }}>
          Tx: {hash.slice(0, 10)}…{hash.slice(-6)}
        </p>
      )}
      {wait === 3 && logs.length > 0 && (
        <p style={{ color: '#20C20E' }}>✓ Confirmed</p>
      )}
      {logErrors.map((err, i) => (
        <p key={i} style={{ color: '#e33' }}>{String(err)}</p>
      ))}
    </div>
  )
}



export const TxResponse = ({
  wait,
  hash,
  logs,
  logErrors
}:{
  wait: number,
  hash: string,
  logs: string[],
  logErrors: string[]
}) => {
  return (
    <div>
      {(wait > 0 ) && <label htmlFor="hash">Hash:</label>}
      {(wait > 0 && !hash ) && <p>waiting for wallet confirmation...</p>}
      {hash && (
        <p className="break-words">{hash}</p>
      )}
      {(wait > 1) && <label htmlFor="logs">confirmation:</label>}
      {(wait > 1 && logs.length === 0) && <p>waiting for tx confirmation...</p>}
      {logs.map((log, i) => {
        return (
          <>
            <p className="break-words" key={i}>{log.transactionHash ? 'successful' : 'failed'}</p>
          </>
        )})}
      {logErrors.map((log, i) => {
        return (
          <p className="break-words" key={i}>{log.toString()}</p>
        )
      })}
    </div>
  )
}

import { getExplorerUrl } from '@/utils/explorer'
import { truncateEthAddress } from '@/utils/address'
import { useAccount } from 'wagmi'
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
  const { chain } = useAccount()
  return (
    <div
      className="flex-wrap-center"
      style={{
        flexDirection: 'column',
        width:`${100/(Math.PHI)+(100/(Math.PHI**3))}%`
      }}
    >

      {(wait > 0) && (
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          }}>
          <p>Transaction: </p>
          {!hash ?
            (<p>waiting for tx confirmation...</p>
            ) : (
              <a target="_blank" href={getExplorerUrl(chain, hash, 'transaction')} className="break-words">{truncateEthAddress(hash)}</a>
          )}
        </div>
      )}
      {(wait > 1) && (
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          }}>
          <p>Logs: </p>
          {logs.length == 0 ? (
            <p>waiting for tx confirmation...</p>
          ) : logs.map((log, i) => {
            return (
              <>
                <p className="break-words" key={i}>{log.transactionHash ? 'successful' : 'failed'}</p>
              </>
            )
          })
          }
        </div>
      )}
      {logErrors.map((log, i) => {
        return (
          <p className="break-words" key={i}>{log.toString()}</p>
        )
      })}
    </div>
  )
}

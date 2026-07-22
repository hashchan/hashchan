import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CacheFlusher } from '@/components/CacheFlusher'
import { PleaseConnectWallet } from '@/components/PleaseConnectWallet'
import { RpcDoctorModal } from '@/components/RpcDoctorModal'
import { OptionsModal } from '@/components/OptionsModal'
import { chainIdToName } from '@/utils/blockchain'
import { useAccount } from 'wagmi'

const SLOW_LOADING_MS = 8000

interface Thread {
  lastSynced: number
  boardId: number
  threadId: string
  creator: string
  imgUrl: string
  imgCID: string
  title: string
  content: string
  janitoredBy: string[]
  chainId: number
  timestamp: number
}

interface ThreadsListProps {
  threads: Thread[]
  isLoading: boolean
  error: Error | null
  address: string | undefined
  isReducedMode?: boolean
}

const ListItem = ({ thread }: { thread: Thread }) => {
  const { chainId, boardId } = useParams()
  const navigate = useNavigate()
  const { threadId, title, imgUrl, content, janitoredBy } = thread

  return (
    <div
      style={{
        filter: (janitoredBy?.length ?? 0) > 0 ? 'brightness(0%)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        width: "233px",
        height: "377px",
        cursor: 'pointer'
      }}
      onClick={() => navigate(`/chains/${chainId}/boards/${boardId}/threads/${threadId}`)}
    >
      {imgUrl && (
        <img
          style={{
            objectFit: 'contain',
            width: '100%',
          }}
          src={imgUrl}
          alt={title}
        />
      )}
      <div 
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: 'center',
          display: '-webkit-box',
          WebkitLineClamp: '3',
          WebkitBoxOrient: 'vertical',
          width: '100%',
          height: '100%',
        }}
      >
        <p style={{ fontSize: '14px' }}>
          <b>{title}</b>
          {content}
        </p>
      </div>
    </div>
  )
}

const ThreadsGrid = ({ threads }: { threads: Thread[] }) => {
  return (
    <div
      style={{
        width: `${100/(Math.PHI)+(100/(Math.PHI**3))+ (100/(Math.PHI**5))}%`,
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: 'row',
        gap: '8px',
      }}
    >
      {threads.map((thread) => (
        <ListItem 
          key={thread.threadId} 
          thread={thread}
        />
      ))}
    </div>
  )
}

const EmptyState = () => {
  const { boardId, chainId } = useParams()
  const { chain } = useAccount()
  
  return (
    <>
      <p>This board is on the {chainIdToName(Number(chainId))}</p>
      <p>Current chain is {chain.name}</p>
      <p>Nothing here yet, be the first to post</p>
      <p>Feel like you should see something? try flushing the cache and refetching</p>
      <CacheFlusher 
        query={
          {
            table: "boards",
            where: "[boardId+chainId]",
            equals: [Number(boardId), Number(chainId)]
          }
        }
        handler={() => window.location.reload()}
      />
    </>
  )
}

// Settings lets them pick blockRangeLimit themselves rather than silently
// landing on the (possibly still-too-large) 10k default. Shared between the
// slow-loading hint and the error state so the recovery buttons stay put
// instead of disappearing the moment a slow fetch finally errors out.
const RpcHint = ({ message }: { message: string }) => (
  <div style={{ marginTop: '13px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
    <p style={{ color: '#f0c040' }}>{message}</p>
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <RpcDoctorModal pxSize="20px" />
      <OptionsModal pxSize="20px" />
    </div>
  </div>
)

const LoadingState = () => {
  const [tookTooLong, setTookTooLong] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setTookTooLong(true), SLOW_LOADING_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{ padding: '21px' }}>
      <p>Loading threads...</p>
      {tookTooLong && <RpcHint message="This is taking a while — your RPC may be rejecting large log ranges." />}
    </div>
  )
}

const ErrorState = ({ error }: { error: Error }) => (
  <div style={{ padding: '21px' }}>
    <p style={{ color: 'red' }}>Error loading threads: {error.message}</p>
    <RpcHint message="Your RPC may be rejecting large log ranges." />
  </div>
)

const WalletRequiredState = () => (
  <PleaseConnectWallet />
)

export const ThreadsList = ({ threads, isLoading, error, address }: ThreadsListProps) => {
  if (!address) {
    return <WalletRequiredState />
  }

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState error={error} />
  }

  if (!threads.length) {
    return <EmptyState />
  }

  return <ThreadsGrid threads={threads} />
}
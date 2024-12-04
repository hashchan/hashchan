import { useParams } from 'react-router-dom'
import { useThreads } from '@/hooks/useThreads'
import { useNavigate } from 'react-router-dom'
import { truncateEthAddress } from '@/utils/address'
import { ReducedModeWarning } from '@/components/ReducedModeWarning'
import { useAccount } from 'wagmi'
const ListItem = ({
  threadId, title, imgUrl, content
}: {
  threadId: string,
  title: string,
  imgUrl: string,
  content: string

}) => {
  const { chainId, boardId } = useParams()
  const navigate  = useNavigate()
  const Title = (
    <p
      style={{
        fontSize: '14px',
      }}
    ><b>{title}</b>{content}</p>)
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        width: "233px",
        height: "377px",
      }}
      onClick={() => navigate(`/chains/${chainId}/boards/${boardId}/thread/${threadId}`)}
    >
      <img
        style={{
          objectFit: 'contain',
          width: '100%',
        }}
        src={imgUrl}
      />
      <div style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textAlign: 'center',
        display: '-webkit-box',
        WebkitLineClamp: '3',
        WebkitBoxOrient: 'vertical',
        width: '100%',
        height: '100%',
      }}>{Title}</div>
    </div>)
}


const List = ({threads}: {threads: any}) => {
  return (
    <div
      style={{
        width: '95vw',
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: 'row',
        gap: '10px',
      }}>
      { threads.length > 0 ? (
        threads.map(({threadId, title, imgUrl, content}, i) => {
          return <ListItem key={threadId + i} threadId={threadId} title={title} imgUrl={imgUrl} content={content} />
        })
      ): (
        <p>Nothing here yet, be the first to post</p>
      )
      }
    </div>
  )
}



export const Catalogue = () => {
  const { address }  = useAccount()
  const { threads, logErrors, isReducedMode } = useThreads()
  return (
    <>
      <span><h3 style={{display: "inline"}}>Catalogue</h3>
      {isReducedMode && <ReducedModeWarning />}</span>
      { address  ?  (
        <List threads={threads} />
      ) : (
        <p>You need an ethereum rpc connection to scrape logs, please connect an ethereum client like metamask</p>
      )

      }
      { logErrors.length > 0 && (
        logErrors.map((error, i) => {
          return <p key={i}>{error}</p>
        })
      )
      }
    </>
  )
}

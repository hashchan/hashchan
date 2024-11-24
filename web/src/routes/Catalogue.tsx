import { useParams } from 'react-router-dom'
import { useThreads } from '@/hooks/useThreads'
import { useNavigate } from 'react-router-dom'
import { truncateEthAddress } from '@/utils'
import { useAccount } from 'wagmi'
const ListItem = ({
  threadId, title, imgUrl, content
}: {
  threadId: string,
  title: string,
  imgUrl: string,
  content: string

}) => {
  const { board } = useParams()
  const navigate  = useNavigate()
  return (
    <div
      className="flex-wrap-center"
      style={{
        flexDirection: 'column',
        backgroundColor: "rgba(0,0,0,0.618)",
        width: "233px",
        height: "377px",
        borderRadius: '16px',
        border: '1px solid #20C20E',
      }}
      onClick={() => navigate(`/boards/${board}/thread/${threadId}`)}
    >
      <p style={{ textAlign: 'center', width: '100%'}}>{title.substring(0, 45)}</p>
      <p style={{ textAlign: 'center', width: '100%'}}>{truncateEthAddress(threadId)}</p>
      <img
        style={{
          objectFit: 'contain',
          height: '161px',
          width: '61px',
        }}
        src={imgUrl}
      />
      <p
        style={{
          width: '90%',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >{content.substring(0, 30)}</p>
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
  const { board } = useParams()
  const { address }  = useAccount()
  const { threads, logErrors } = useThreads({board})
  return (
    <>
      <h3>Catalogue</h3>
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

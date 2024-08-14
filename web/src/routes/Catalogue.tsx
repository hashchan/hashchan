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
      style={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        backgroundColor: "rgba(0,0,0,0.618)",
        width: "377px",
        height: "610px",
        borderRadius: '16px',
        border: '1px solid #20C20E',
      }}
      onClick={() => navigate(`/boards/${board}/thread/${threadId}`)}
    >
      <h3 style={{paddingTop: '1.25vh', textAlign: 'center', width: '100%'}}>{title}</h3>
      <p style={{paddingBottom: '1.25vh', textAlign: 'center', width: '100%'}}>{truncateEthAddress(threadId)}</p>
      <img
        style={{
          objectFit: 'contain',
          height: '261px',
          width: '161px',
        }}
        src={imgUrl}
      />
      <p
        style={{
          width: '90%',
          textAlign: 'center',
        }}
      >{content.substring(0, 100)}</p>
    </div>)
}


const List = ({threads}: {threads: any}) => {
  console.log('threads', threads)
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
        threads.map(({id, title, imgUrl, content}, i) => {
          return <ListItem key={id + i} threadId={id} title={title} imgUrl={imgUrl} content={content} />
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
  console.log('board', board)
  const { threads, logErrors } = useThreads({board})
  return (
    <>
      <h3>Catalogue</h3>
      { address  ?  (
        <List threads={threads} />
      ) : (
        <p>You need an ethereum rpc connection to scrape ethereum logs, please connect a wallet</p>
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

import { useParams } from 'react-router-dom'
import { useThreads } from '@/hooks/useThreads'
import { useNavigate } from 'react-router-dom'
import { truncateEthAddress } from '@/utils'

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
        backgroundColor: "rgba(0,0,0,0.5)",
        width: "377px",
        height: "610px"
      }}
      onClick={() => navigate(`/boards/${board}/thread/${threadId}`)}
    >
      <h3 style={{paddingTop: '10px', textAlign: 'center', width: '100%'}}>{title}</h3>
      <p style={{paddingBottom: '10px', textAlign: 'center', width: '100%'}}>{truncateEthAddress(threadId)}</p>
      <img
        style={{
          maxWidth: '95%',
          maxHeight: '65%'
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
      {
        threads.map(({id, title, imgUrl, content}, i) => {
          return <ListItem key={id + i} threadId={id} title={title} imgUrl={imgUrl} content={content} />
        })
      }
    </div>
  )
}

export const Catalogue = () => {
  const { board } = useParams()
  console.log('board', board)
  const { threads } = useThreads({board})

  return (
    <>
      <h3>Catalogue</h3>
      { threads && 
      <List threads={threads} />
      }
    </>
  )
}

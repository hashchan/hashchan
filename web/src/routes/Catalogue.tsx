import { useParams } from 'react-router-dom'
import { useThreads } from '@/hooks/useThreads'
import { useNavigate } from 'react-router-dom'
const ListItem = ({
  threadId, title, imgUrl
}: {
  threadId: string,
  title: string,
  imgUrl: string

}) => {
  const { board } = useParams()
  const navigate  = useNavigate()
  return (<button onClick={() => navigate(`/boards/${board}/thread/${threadId}`)}>
    <h3>{title}</h3>
    <p>{threadId}</p>
    <p>{imgUrl}</p>
    <p>{threadId}</p>
  </button>)
}


const List = ({threads}: {threads: any}) => {
  console.log('threads', threads)
  return (<>{
    threads.map(({id, title, imgUrl}, i) => {
      return <ListItem key={id + i} threadId={id} title={title} imgUrl={imgUrl} />
    })
    }
  </>)
}

export const Catalogue = () => {
  const { board } = useParams()
  const { threads } = useThreads(board)

  return (
    <>
      <h3>Catalogue</h3>
      { threads && 
      <List threads={threads} />
      }
    </>
  )
}

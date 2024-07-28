import { useParams } from 'react-router-dom'
import { useThreads } from '@/hooks/useThreads'

const ListItem = ({
  threadId, title, imgUrl
}: {
  threadId: string,
  title: string,
  imgUrl: string

}) => {

  return (<>

  </>)
}


const List = (threads) => {

  return (<>{
    threads.map(({threadId, title, imgUrl}) => {
      return <List key={threadId} threadId={threadId} title={title} imgUrl={imgUrl} />
    })
    }
  </>)
}

export const Catalogue = () => {
  const { board } = useParams()
  const { threads } = useThreads(board)

  return (
    <>
      <h1>Catalogue {board}</h1>

    </>
  )
}

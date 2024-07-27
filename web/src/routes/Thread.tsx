import { useParams  } from 'react-router-dom'


export const Thread = () => {
  const { board, thread } = useParams()

  return (
    <>
      <h1>Thread {thread}</h1>

    </>
  )
}

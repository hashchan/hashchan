import { useParams } from 'react-router-dom'

export const Catalogue = () => {
  const { board } = useParams()
  return (
    <>
      <h1>Catalogue {board}</h1>
    </>
  )
}

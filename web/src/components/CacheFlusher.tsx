import { useState, useEffect, useContext } from 'react'
import { IDBContext } from '@/provider/IDBProvider'

// Define a query type
type QueryParams = {
  table: string;
  where: string;
  equals: any | any[]
}

export const CacheFlusher = ({ query, handler }: { query: QueryParams, handler: () => void }) => {
  const { db } = useContext(IDBContext)
  const [response, setResponse] = useState()
  const [lastSynced, setLastSynced] = useState(0)
  
  useEffect(() => {
    if (!db) {
      return
    }
    
    const fetchData = async () => {
      console.log('querying cache', query.table, query.where, query.equals)
      const { table, where, equals } = query
      const res = await db[table].where(where).equals(equals).toArray()

      setResponse(res)
      try {
        if (res[0]?.lastSynced) {
          setLastSynced(res[0].lastSynced)
        }
      } catch(e) {
        console.log(e)
      }
      return res
    }
    
    fetchData()
  }, [db, query]) // Now we only depend on db and the query object

  const handleCacheFlush = async () => {
    try {
      const res = await db[query.table].where(query.where).equals(query.equals).modify({lastSynced: 0})
      console.log('updated', res)
      setResponse(null)
      setLastSynced(0)
      handler()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <button onClick={() => handleCacheFlush()}>Flush cache</button>
      { lastSynced && <p>Last synced: {lastSynced}</p> }
    </>
  )
}

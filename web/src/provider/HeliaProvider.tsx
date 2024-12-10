/* eslint-disable no-console */

import { IDBBlockstore } from 'blockstore-idb'
import { IDBDatastore } from 'datastore-idb'
import { createLibp2p  } from 'libp2p'
import { createHelia } from 'helia'
import { createOrbitDB  } from '@orbitdb/core'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'

import { identify  } from "@libp2p/identify";


import { unixfs } from '@helia/unixfs'
import {dagJson} from '@helia/dag-json'
import PropTypes from 'prop-types'
import {
  useEffect,
  useState,
  useCallback,
  createContext
} from 'react'

export const HeliaContext = createContext({
  libp2p: null,
  helia: null,
  orbit: null,
  orbitDB: null,
  dj: null,
  fs: null,
  error: false,
  starting: true
})

export const HeliaProvider = ({ children }) => {
  const [libp2p, setLibp2p] = useState(null)
  const [helia, setHelia] = useState(null)
  const [orbit, setOrbit] = useState(null)
  const [orbitDB, setOrbitDB] = useState(null)

  const [fs, setFs] = useState(null)
  const [dj, setDj] = useState(null)
  const [starting, setStarting] = useState(true)
  const [error, setError] = useState(null)

  const startHelia = useCallback(async () => {
    console.log('starting Helia')
    const datastore = new IDBDatastore('./hashchan/datastore')
    const blockstore = new IDBBlockstore('./hashchan/blockstore')

      try {
        await datastore.open()
        await blockstore.open()
        const libp2p = await createLibp2p({
          datastore,
          services: {
            pubsub: gossipsub({
              allowPublishToZeroTopicPeers: true
            }),
            identify: identify()
          }
        })
        const helia = await createHelia({
          datastore,
          blockstore,
          libp2p
        })
        const orbit = await createOrbitDB({ipfs:helia})

        const db  = await orbit.open('hashchan')

        setLibp2p(libp2p)
        setHelia(helia)
        setOrbit(orbit)
        setOrbitDB(db)
        setDj(dagJson(helia))
        setFs(unixfs(helia))
        setStarting(false)
      } catch (e) {
        console.error(e)
        setError(true)
      }
  }, [])

  useEffect(() => {
    startHelia()
  }, [])

  return (
    <HeliaContext.Provider
      value={{
        libp2p,
        helia,
        orbit,
        orbitDB,
        dj,
        fs,
        error,
        starting
      }}
    >{children}</HeliaContext.Provider>
  )
}

HeliaProvider.propTypes = {
  children: PropTypes.any
}

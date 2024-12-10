/* eslint-disable no-console */

import { IDBBlockstore } from 'blockstore-idb'
import { IDBDatastore } from 'datastore-idb'
import { createLibp2p  } from 'libp2p'
import { createHelia } from 'helia'
import { createOrbitDB  } from '@orbitdb/core'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'

import { yamux  } from '@chainsafe/libp2p-yamux'
import { noise  } from '@chainsafe/libp2p-noise'
import { identify  } from "@libp2p/identify";
import { webSockets  } from '@libp2p/websockets'
import { webRTC  } from '@libp2p/webrtc'

import * as filters from '@libp2p/websockets/filters'
import { circuitRelayTransport  } from '@libp2p/circuit-relay-v2'
import { multiaddr  } from '@multiformats/multiaddr'


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
          addresses: {
            listen: [
              '/webrtc'
            ]
          },
          transports: [
            webSockets({
              filter: filters.all
            }),
            webRTC(),
            circuitRelayTransport()
          ],
          connectionEncrypters: [noise()],
          streamMuxers: [yamux()],
          connectionGater: {
            denyDialMultiaddr: () => {
              return false
            }
          },
          services: {
            pubsub: gossipsub({
              allowPublishToZeroTopicPeers: true
            }),
            identify: identify(),
          }
        })



        const helia = await createHelia({
          datastore,
          blockstore,
          libp2p
        })

        const orbit = await createOrbitDB({ipfs:helia})

        const db  = await orbit.open('hashchan')

        //const dial = await helia.libp2p.dial(multiaddr('/ip4/127.0.0.1/tcp/40113/ws/p2p/12D3KooWQMdBkn7wH8tJiaYqGaRXK3HnN4WPFwQLieqc58uabf5a'))
        //const dial = await helia.libp2p.dial(multiaddr('/ip4/192.53.120.61/tcp/81/ws'))
        console.log('dial', dial)
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

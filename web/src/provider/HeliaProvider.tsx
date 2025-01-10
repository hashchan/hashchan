/* eslint-disable no-console */

import { IDBBlockstore } from 'blockstore-idb'
import { IDBDatastore } from 'datastore-idb'
import { createLibp2p  } from 'libp2p'
import { createHelia } from 'helia'
import { heliaWithRemotePins  } from '@helia/remote-pinning'

import { createOrbitDB, useIdentityProvider } from '@orbitdb/core'
import * as OrbitDBIdentityProviderEthereum from '@orbitdb/identity-provider-ethereum'

import { gossipsub } from '@chainsafe/libp2p-gossipsub'

import { yamux  } from '@chainsafe/libp2p-yamux'
import { noise  } from '@chainsafe/libp2p-noise'
import { identify  } from "@libp2p/identify";
import { webSockets  } from '@libp2p/websockets'
import { webRTC  } from '@libp2p/webrtc'

import * as filters from '@libp2p/websockets/filters'
import { circuitRelayTransport  } from '@libp2p/circuit-relay-v2'

import { getWalletInterface } from '@/utils/blockchain'
import { unixfs } from '@helia/unixfs'
import {dagJson} from '@helia/dag-json'
import PropTypes from 'prop-types'
import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext
} from 'react'

import { IDBContext } from './IDBProvider'
import { useAccount } from 'wagmi'
import { useWalletClient } from 'wagmi'

export const HeliaContext = createContext({
  libp2p: null,
  helia: null,
  dj: null,
  fs: null,
  orbit: null,
  error: false,
  starting: true,
  startOrbitDb: async () => {},
  startHelia: async () => {}
})

export const HeliaProvider = ({ children }) => {
  useIdentityProvider(OrbitDBIdentityProviderEthereum.default)
  const {address} = useAccount()
  const walletClient = useWalletClient()
  const [isInitialized, setIsInitialized] = useState(false)
  const { db } = useContext(IDBContext)
  const [libp2p, setLibp2p] = useState(null)
  const [helia, setHelia] = useState(null)
  const [orbit, setOrbit] = useState(null)
  //const [orbitDB, setOrbitDB] = useState(null)

  const [fs, setFs] = useState(null)
  const [dj, setDj] = useState(null)
  const [starting, setStarting] = useState(true)
  const [error, setError] = useState(null)

  const startHelia = useCallback(async () => {
    console.log('starting Helia')
    if (!db) return
    if (!address) return
    if (!walletClient?.data) return
    if (!address) return

    // Use consistent names for the datastores
    const datastoreName = 'hashchan-datastore'
    const blockstoreName = 'hashchan-blockstore'
    
    const datastore = new IDBDatastore(datastoreName)
    const blockstore = new IDBBlockstore(blockstoreName)

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
      let helia;
      const remotePin = JSON.parse(localStorage.getItem('remote-pin'))
      if (!remotePin) {
        helia = await createHelia({
          datastore,
          blockstore,
          libp2p
        })
      } else {
        helia = heliaWithRemotePins(await createHelia({
          datastore,
          blockstore,
          libp2p
        }), {
          endpointUrl: remotePin.endpointUrl,
          accessToken: remotePin.accessToken
        })
      }



      // Try to get the stored database address from localStorage
      //const storedDbAddress = localStorage.getItem('hashchanDbAddress')
      const settings = await db.settings.get(1)
      console.log('settings', settings)
      helia.libp2p.addEventListener('peer:discovery', (event) => {
        console.log('Discovered peer:', event.detail.id.toString())
      })

      // Listen for peer connection
      helia.libp2p.addEventListener('peer:connect', (event) => {
        console.log('Connected to peer:', event.detail.toString())
      })

      setLibp2p(libp2p)
      setHelia(helia)
      setDj(dagJson(helia))
      setFs(unixfs(helia))
      setStarting(false)
      setIsInitialized(true)
    } catch (e) {
      console.error(e)
      setError(true)
    }
  }, [
    db,
    address,
    walletClient?.data
  ])

  const startOrbitDb = useCallback(async () => {
    console.log('start orbit')
    console.log(Boolean(address), Boolean(helia), Boolean(db), Boolean(walletClient.data))
    if(!address || !helia || !db || !walletClient.data) return
      let orbit = null
      if (await db.moderationServices.count() > 0) {
        const walletInterface =  getWalletInterface({
          address,
          walletClient: walletClient.data
        })
        const ethProvider = OrbitDBIdentityProviderEthereum.default({ wallet: walletInterface  })
        try  {
          orbit = await createOrbitDB({
            ipfs:helia,
            identity: {provider: ethProvider}
          })

        } catch (e) {
          console.log('orbit signature reject janny service offline')
        }
      } else {
        orbit = await createOrbitDB({
          ipfs:helia
        })
      }

      setOrbit(orbit)

  }, [helia, db, address, walletClient.data])

  useEffect(() => {
    if (!helia) return

    startOrbitDb()
  }, [helia, startOrbitDb])

  useEffect(() => {
    if (isInitialized ||
        !address ||
        !walletClient?.data ||
        !db) return

      startHelia()

  }, [
    walletClient?.data,
    address, db, startHelia, isInitialized])

  return (
    <HeliaContext.Provider
      value={{
        libp2p,
        helia,
        orbit,
        dj,
        fs,
        error,
        starting,
        startOrbitDb,
        startHelia
      }}
    >{children}</HeliaContext.Provider>
  )
}

HeliaProvider.propTypes = {
  children: PropTypes.any
}

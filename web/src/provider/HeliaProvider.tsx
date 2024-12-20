/* eslint-disable no-console */

import { IDBBlockstore } from 'blockstore-idb'
import { IDBDatastore } from 'datastore-idb'
import { createLibp2p  } from 'libp2p'
import { createHelia } from 'helia'

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
import { multiaddr  } from '@multiformats/multiaddr'


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
  starting: true
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

      const walletInterface = {
        address: address,
        getAddress: () => address,
        signMessage: async (message: string) => {
          console.log('signing message', message)
          const oldSig = localStorage.getItem(address)
          if (oldSig) return oldSig
          const signature = await walletClient.data.signMessage({
            message,
            account: address

          })

          localStorage.setItem(address, signature)
          return signature

        }

      }

    const ethProvider = OrbitDBIdentityProviderEthereum.default({ wallet: walletInterface  })



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



      const helia = await createHelia({
        datastore,
        blockstore,
        libp2p
      })

      let orbit = null
      try  {
        orbit = await createOrbitDB({
          ipfs:helia,
          identity: {provider: ethProvider}
        })

      } catch (e) {
        console.log('orbit signature reject janny service offline')
      }

      // Try to get the stored database address from localStorage
      //const storedDbAddress = localStorage.getItem('hashchanDbAddress')
      const settings = await db.settings.get(1)
      console.log('settings', settings)
      /*let orbitdb;
      if (settings.orbitDbAddr) {
        // If we have a stored address, try to open the existing database
        try {
          orbitdb = await orbit.open(settings.orbitDbAddr)
          console.log('Opened existing database:', settings.orbitDbAddr)
        } catch (err) {
          console.warn('Failed to open existing database, creating new one:', err)
          orbitdb = await orbit.open(settings.orbitDbAddr)
          // Store the new database address

        }
      } else {
        // First time - create new database
        orbitdb = await orbit.open('hashchan')
        // Store the database address for future use
        await db.settings.where('id').equals(1).modify({orbitDbAddr: orbitdb.address.toString()})

      }
       */
      helia.libp2p.addEventListener('peer:discovery', (event) => {
        console.log('Discovered peer:', event.detail.id.toString())
      })

      // Listen for peer connection
      helia.libp2p.addEventListener('peer:connect', (event) => {
        console.log('Connected to peer:', event.detail.toString())
      })
      /*
      orbitdb.events.on('ready', () => {
        console.log('OrbitDB is ready')
      })

      orbitdb.events.on('update', async (entry) => {
        console.log('OrbitDB updated', entry)
      })
       */



      setLibp2p(libp2p)
      setHelia(helia)
      setOrbit(orbit)
      setDj(dagJson(helia))
      setFs(unixfs(helia))
      setStarting(false)
    } catch (e) {
      console.error(e)
      setError(true)
    }
  }, [
    db,
    address,
    walletClient?.data
  ])

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
        starting
      }}
    >{children}</HeliaContext.Provider>
  )
}

HeliaProvider.propTypes = {
  children: PropTypes.any
}

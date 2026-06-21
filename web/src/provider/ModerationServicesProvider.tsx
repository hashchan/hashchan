import {
  useState,
  useEffect,
  useContext,
  useCallback,
  createContext
} from 'react'
import { getContract } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'

import { multiaddr  } from '@multiformats/multiaddr'
import { lpStream } from '@libp2p/utils'
import { CID } from 'multiformats/cid'
import { base58btc } from 'multiformats/bases/base58'
import ModerationService from '@/assets/abi/ModerationService.json'

const ORBITDB_PROTOCOL = '/hashchan/orbitdb/1.0.0'
import { HeliaContext } from '@/provider/HeliaProvider'
import { IDBContext } from '@/provider/IDBProvider'
import { useAccount } from 'wagmi'
export const ModerationServicesContext = createContext({
  moderationServices: {} | null,
  orbitDbs: {} | null,
  addPubsubHandle: () => {},
})

export const ModerationServicesProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [moderationServices, setModerationServices] = useState(null)
  const [orbitDbs, setOrbitDbs] = useState(null)
  const [messageLog, setMessageLog] = useState([])
  const [logErrors, setLogErrors] = useState([])
  const { helia, orbit } = useContext(HeliaContext)
  const { db } = useContext(IDBContext)
  const {chain} = useAccount()

  const publicClient = usePublicClient();
  const walletClient = useWalletClient();

  const addPubsubHandle = useCallback(async () => {
    if (!helia && !db && !orbit) return

    helia.libp2p.services.pubsub.addEventListener('message', async (event) => {
      let { topic, data } = event.detail

      const [ , , chainId, , addr, route ] = topic.split('/')
      console.log('pubsub::message', topic, data)
      if (topic.includes('orbitdb')) return

      try {
        data = JSON.parse(new TextDecoder().decode(data))
        setMessageLog(old =>[...old, data])
      } catch (e) {
        console.log('error', e)
        setLogErrors(old =>[...old, e.message])
      }
      if (route == 'ping') {
        await db.moderationServices
          .where('[address+chainId]')
          .equals([addr, chainId]).modify({orbitDbAddr: data.orbitDbAddr})
        console.log('open modservice provider')
        const orbitdb = await orbit.open(data.orbitDbAddr)

        orbitdb.events.on('update', async (entry) => {
          console.log('update', entry)
        })
        setOrbitDbs(old => ({
          ...old,
          [addr]: orbitdb
        }))
      } else {
        if (data.success) {
          console.log('success')
        }
      }
    })
  }, [
    helia,
    orbit,
    db
  ])

  const fetchSubscribedModerationServices = useCallback(async () => {
    if (helia && db && publicClient && walletClient?.data && orbit && chain?.id) {
      const subscribedModerationServices = await db.moderationServices
      .where({
        subscribed: 1,
        chainId: Number(chain.id)
      }).toArray()

      addPubsubHandle()
      const modServices = {}
      const newOrbitDbs = {}

      for (const ms of subscribedModerationServices) {
        try {
          const dial = await helia.libp2p.dial(multiaddr(`/dns4/${ms.uri}/tcp/${ms.port}/wss`))
          const baseUrl = `/chainId/${ms.chainId}/address/${ms.address}`
          await helia.libp2p.services.pubsub.subscribe(baseUrl)
          const instance = getContract({
            address: ms.address,
            abi: ModerationService.abi,
            client: {
              public: publicClient,
              wallet: walletClient.data
            }
          })

          modServices[ms.address] = {
            ...ms,
            instance,
            dialed: dial
          }

          // Fetch manifest + ACL bytes directly over the protocol so orbit.open()
          // finds them in the local blockstore instead of going through Bitswap
          try {
            const stream = await helia.libp2p.dialProtocol(
              multiaddr(`/dns4/${ms.uri}/tcp/${ms.port}/wss`),
              ORBITDB_PROTOCOL
            )
            const lp = lpStream(stream)
            const msg = await lp.read()
            const { orbitDbAddr, manifestBytes, aclAddr, aclBytes } = JSON.parse(
              new TextDecoder().decode(msg.subarray())
            )
            if (manifestBytes) {
              const manifestCid = CID.parse(orbitDbAddr.replace('/orbitdb/', ''), base58btc)
              await helia.blockstore.put(manifestCid, new Uint8Array(manifestBytes))
            }
            if (aclBytes && aclAddr) {
              const aclCid = CID.parse(aclAddr.replace('/ipfs/', ''), base58btc)
              await helia.blockstore.put(aclCid, new Uint8Array(aclBytes))
            }
          } catch (e) {
            console.warn('[orbit] block pre-populate failed, Bitswap fallback:', e)
          }

          console.log('[orbit] open', ms.orbitDbAddr)
          const orbitDb = await orbit.open(ms.orbitDbAddr)
          console.log('opened maybe', orbitDb)
          newOrbitDbs[ms.address] = orbitDb

        } catch (e) {
          console.log('error', e)
          modServices[ms.address] = {
            ...ms,
            dailed: false,
            instance: null
          }
        }
      }

      setOrbitDbs(newOrbitDbs)
      setModerationServices(modServices)
    }
  }, [
    addPubsubHandle,
    helia,
    orbit,
    db,
    publicClient,
    walletClient?.data,
    chain?.id
  ])

  useEffect(() => {
    if (isInitialized ||
       !helia ||
       !db ||
       !publicClient ||
       !walletClient?.data ||
       !orbit ||
       !chain?.id
       ) return

      const init = async () => {
        await fetchSubscribedModerationServices()
        setIsInitialized(true)
      }
      init()
  } ,[
    isInitialized,
    helia,
    orbit,
    db,
    publicClient,
    walletClient?.data,
    fetchSubscribedModerationServices,
    chain?.id
  ])

  return (
    <ModerationServicesContext.Provider
      value={{
        addPubsubHandle,
        moderationServices,
        orbitDbs
      }}
    >
      {children}
    </ModerationServicesContext.Provider>
  )
}

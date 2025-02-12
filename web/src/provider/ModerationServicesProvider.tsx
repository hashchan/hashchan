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
import ModerationService from '@/assets/abi/ModerationService.json'
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
    console.log('adding pubsub handle')
    if (!helia && !db && !orbit) return 
    //const listenerCount = helia.libp2p.services.pubsub.listenerCount('message')
    //console.log('listenerCount', listenerCount)
    //if (listenerCount > 1) return
    
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
        console.log('ping received', data)
        await db.moderationServices
          .where('[address+chainId]')
          .equals([addr, chainId]).modify({orbitDbAddr: data.orbitDbAddr})
        
        const orbitdb = await orbit.open(data.orbitDbAddr)


        orbitdb.events.on('ready', async () => {
          console.log(' orbit ready')
        })
        orbitdb.events.on('update', async (entry) => {
          console.log('update', entry)
        })
        setOrbitDbs(old => ({
          ...old,
          [addr]: orbitdb
        }))
        console.log('pubsub::message', topic, data)

      } else {
        if (data.success) {
          console.log('success')
          console.log('pubsub::message', topic, data)
          /*
           * Ideally now handled by orbit db replication
          try {
            const janitored = await db.janitored.add({
              moderationServiceAddress: data.record.janny.domain.verifyingContract,
              moderationServiceChainId: data.record.janny.message.chainId,
              threadId: data.typedData.message.threadId,
              postId: data.typedData.message.postId,
              reason: data.typedData.message.reason
            })
          } catch (e) {
            console.log('error creating janitor entry', e.message)
          }
           */
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

      subscribedModerationServices.forEach(async (ms) => {
        try {
          const dial = await helia.libp2p.dial(multiaddr(`/dns4/${ms.uri}/tcp/${ms.port}/wss`))
          console.log('ms.address', ms.address)
          const baseUrl = `/chainId/${ms.chainId}/address/${ms.address}`
          await helia.libp2p.services.pubsub.subscribe(baseUrl)
          await helia.libp2p.services.pubsub.subscribe(`${baseUrl}/ping`)
          setTimeout(() => {
            helia.libp2p.services.pubsub.publish(`${ms.address}/ping`, '')
          }, 618)
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
          console.log('ms.orbitDbAddr', ms.orbitDbAddr)
          const orbitDb = await orbit.open(ms.orbitDbAddr)
          setOrbitDbs((old) => {
            return {
              ...old,
              [ms.address]: orbitDb
            }
          }) 

        } catch (e) {
          console.log('error', e)

          modServices[ms.address] = {
            ...ms,
            dailed: false,
            instance: null
          }
        }
      })

      console.log('adding event listener')
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
    console.log('mod servcie init')
    console.log(Boolean(isInitialized), Boolean(helia), Boolean(db), Boolean(publicClient), Boolean(walletClient?.data), Boolean(orbit), Boolean(chain?.id))
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

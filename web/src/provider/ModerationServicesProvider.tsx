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

export const ModerationServicesContext = createContext({
  moderationServices: [],
  addPubsubHandle: () => {},
})

export const ModerationServicesProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [moderationServices, setModerationServices] = useState([])
  const [messageLog, setMessageLog] = useState([])
  const [logErrors, setLogErrors] = useState([])
  const { helia } = useContext(HeliaContext)
  const { db } = useContext(IDBContext)

  const publicClient = usePublicClient();
  const walletClient = useWalletClient();

  const addPubsubHandle = useCallback(async () => {
    if (!helia && !db) return 
    //const listenerCount = helia.libp2p.services.pubsub.listenerCount('message')
    //console.log('listenerCount', listenerCount)
    //if (listenerCount > 1) return
    
    helia.libp2p.services.pubsub.addEventListener('message', async (event) => {
      let { topic, data } = event.detail
      try {
        data = JSON.parse(new TextDecoder().decode(data))
        setMessageLog(old =>[...old, data])
      } catch (e) {
        console.log('error', e)
        setLogErrors(old =>[...old, e.message])
      }
      if (data.success) {
        console.log('success')
        console.log('pubsub::message', topic, data)
        try {
          const janitored = await db.janitored.add({
            moderationServiceAddress: data.typedData.domain.verifyingContract,
            moderationServiceChainId: data.typedData.message.chainId,
            threadId: data.typedData.message.threadId,
            postId: data.typedData.message.postId,
            reason: data.typedData.message.reason
          })
        } catch (e) {
          console.log('error creating janitor entry', e.message)
        }
      }
    })
  }, [
    helia,
    db
  ])

  const fetchSubscribedModerationServices = useCallback(async () => {
    if (helia && db && publicClient && walletClient?.data) {
      const subscribedModerationServices = await db.moderationServices
        .where('subscribed')
        .equals(1)
        .toArray()

      const modServices = subscribedModerationServices.map(async (ms) => {
        try {
          const dial = await helia.libp2p.dial(multiaddr(`/dns4/${ms.uri}/tcp/${ms.port}/wss`))
          console.log('ms.address', ms.address)
          await helia.libp2p.services.pubsub.subscribe(ms.address)
          const instance = getContract({
            address: ms.address,
            abi: ModerationService.abi,
            client: {
              public: publicClient,
              wallet: walletClient.data
            }
          })

          return {
            ...ms,
            instance,
            dialed: dial
          }

        } catch (e) {
          console.log('error', e)
          return {
            ...ms,
            dailed: false,
            instance: null
          }
        }
      })

      console.log('adding event listener')
      addPubsubHandle()
      setModerationServices(await Promise.all(modServices))
    }
  }, [
    addPubsubHandle,
    helia,
    db,
    publicClient,
    walletClient?.data
  ])

  useEffect(() => {
    if (isInitialized ||
       !helia ||
       !db ||
       !publicClient ||
       !walletClient?.data ) return

      const init = async () => {
        await fetchSubscribedModerationServices()
        setIsInitialized(true)
      }
      init()
  } ,[
    isInitialized,
    helia,
    db,
    publicClient,
    walletClient?.data,
    fetchSubscribedModerationServices
  ])

  return (
    <ModerationServicesContext.Provider
      value={{
        addPubsubHandle,
        moderationServices
      }}
    >
      {children}
    </ModerationServicesContext.Provider>
  )

  
}

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
  moderationServices: []
})

export const ModerationServicesProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [moderationServices, setModerationServices] = useState([])
  const { helia } = useContext(HeliaContext)
  const { db } = useContext(IDBContext)

  const publicClient = usePublicClient();
  const walletClient = useWalletClient();

  const fetchSubscribedModerationServices = useCallback(async () => {
    if (helia && db && publicClient && walletClient) {
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
      helia.libp2p.services.pubsub.addEventListener('message', async (event) => {
        let { topic, data } = event.detail
        console.log('pubsub::message', topic, data)
        data = JSON.parse(new TextDecoder().decode(data))
        if (data.success) {
          try {
            const janitored = await db.janitored.add({
              moderationServiceAddress: data.typedData.message.address,
              moderationServiceChainId: data.typedData.message.chainId,
              postId: data.typedData.message.postId,
              reason: data.typedData.message.reason
            })
          } catch (e) {
            console.log('error creating janitor entry', e.message)
          }
        }
      })

    setModerationServices(await Promise.all(modServices))
    }
  }, [
    helia,
    db,
    publicClient,
    walletClient
  ])

  useEffect(() => {
    if (isInitialized ||
       !helia ||
       !publicClient ||
       !walletClient ) return

      const init = async () => {
        await fetchSubscribedModerationServices()
        setIsInitialized(true)
      }
      init()
  } ,[
    isInitialized,
    helia,
    publicClient,
    walletClient,
    fetchSubscribedModerationServices
  ])

  return (
    <ModerationServicesContext.Provider
      value={{
        moderationServices
      }}
    >
      {children}
    </ModerationServicesContext.Provider>
  )

  
}

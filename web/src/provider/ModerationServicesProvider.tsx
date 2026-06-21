import {
  useState,
  useEffect,
  useContext,
  useCallback,
  createContext
} from 'react'
import { getContract } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'
import { multiaddr } from '@multiformats/multiaddr'
import { lpStream } from '@libp2p/utils'
import ModerationService from '@/assets/abi/ModerationService.json'
import { HeliaContext } from '@/provider/HeliaProvider'
import { IDBContext } from '@/provider/IDBProvider'
import { useAccount } from 'wagmi'

const QUERY_PROTOCOL = '/hashchan/query/1.0.0'
const QUERY_BATCH_PROTOCOL = '/hashchan/query-batch/1.0.0'

export const ModerationServicesContext = createContext({
  moderationServices: {} as Record<string, any> | null,
  queryModerationRecord: async (_msAddress: string, _postId: string): Promise<any> => null,
  queryModerationRecords: async (_msAddress: string, _postIds: string[]): Promise<Record<string, any>> => ({}),
  addPubsubHandle: () => {},
})

export const ModerationServicesProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [moderationServices, setModerationServices] = useState(null)
  const [messageLog, setMessageLog] = useState([])
  const [logErrors, setLogErrors] = useState([])
  const { helia } = useContext(HeliaContext)
  const { db } = useContext(IDBContext)
  const { chain } = useAccount()

  const publicClient = usePublicClient()
  const walletClient = useWalletClient()

  const queryModerationRecord = useCallback(async (msAddress: string, postId: string) => {
    const ms = moderationServices?.[msAddress]
    if (!ms || !helia) return null
    try {
      const ma = multiaddr(`/dns4/${ms.uri}/tcp/${ms.port}/wss`)
      const stream = await helia.libp2p.dialProtocol(ma, QUERY_PROTOCOL)
      const lp = lpStream(stream)
      await lp.write(new TextEncoder().encode(JSON.stringify({ postId })))
      const msg = await lp.read()
      const { record } = JSON.parse(new TextDecoder().decode(msg.subarray()))
      return record
    } catch (e) {
      console.error('[query] failed:', e)
      return null
    }
  }, [moderationServices, helia])

  const queryModerationRecords = useCallback(async (msAddress: string, postIds: string[]) => {
    const ms = moderationServices?.[msAddress]
    if (!ms || !helia || !postIds.length) return {}
    try {
      const ma = multiaddr(`/dns4/${ms.uri}/tcp/${ms.port}/wss`)
      const stream = await helia.libp2p.dialProtocol(ma, QUERY_BATCH_PROTOCOL)
      const lp = lpStream(stream)
      await lp.write(new TextEncoder().encode(JSON.stringify({ postIds })))
      const msg = await lp.read()
      const { records } = JSON.parse(new TextDecoder().decode(msg.subarray()))
      return records ?? {}
    } catch (e) {
      console.error('[query-batch] failed:', e)
      return {}
    }
  }, [moderationServices, helia])

  const addPubsubHandle = useCallback(async () => {
    if (!helia || !db) return

    helia.libp2p.services.pubsub.addEventListener('message', async (event) => {
      let { topic, data } = event.detail
      console.log('pubsub::message', topic)

      try {
        data = JSON.parse(new TextDecoder().decode(data))
        setMessageLog(old => [...old, data])
      } catch (e) {
        setLogErrors(old => [...old, e.message])
      }
    })
  }, [helia, db])

  const fetchSubscribedModerationServices = useCallback(async () => {
    if (helia && db && publicClient && walletClient?.data && chain?.id) {
      const subscribedModerationServices = await db.moderationServices
        .where({ subscribed: 1, chainId: Number(chain.id) })
        .toArray()

      addPubsubHandle()
      const modServices = {}

      for (const ms of subscribedModerationServices) {
        try {
          await helia.libp2p.dial(multiaddr(`/dns4/${ms.uri}/tcp/${ms.port}/wss`))
          const baseUrl = `/chainId/${ms.chainId}/address/${ms.address}`
          await helia.libp2p.services.pubsub.subscribe(baseUrl)
          const instance = getContract({
            address: ms.address,
            abi: ModerationService.abi,
            client: { public: publicClient, wallet: walletClient.data }
          })
          modServices[ms.address] = { ...ms, instance }
        } catch (e) {
          console.log('[ms] failed to connect to', ms.address, e)
          modServices[ms.address] = { ...ms, instance: null }
        }
      }

      setModerationServices(modServices)
    }
  }, [addPubsubHandle, helia, db, publicClient, walletClient?.data, chain?.id])

  useEffect(() => {
    if (isInitialized || !helia || !db || !publicClient || !walletClient?.data || !chain?.id) return
    const init = async () => {
      await fetchSubscribedModerationServices()
      setIsInitialized(true)
    }
    init()
  }, [isInitialized, helia, db, publicClient, walletClient?.data, fetchSubscribedModerationServices, chain?.id])

  return (
    <ModerationServicesContext.Provider
      value={{ addPubsubHandle, moderationServices, queryModerationRecord, queryModerationRecords }}
    >
      {children}
    </ModerationServicesContext.Provider>
  )
}

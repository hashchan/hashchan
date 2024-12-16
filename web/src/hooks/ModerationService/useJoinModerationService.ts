import {
  useEffect,
  useState,
  useCallback,
  useContext
} from 'react'

import {
  useContracts
} from '@/hooks/useContracts'

import {
  useAccount
} from 'wagmi'

import {
  HeliaContext
} from '@/provider/HeliaProvider'

import {
  IDBContext
} from '@/provider/IDBProvider'

import {
  ModerationServicesContext
} from '@/provider/ModerationServicesProvider'

import { multiaddr  } from '@multiformats/multiaddr'
export const useJoinModerationService = (ms: any) => {
  const { helia } = useContext(HeliaContext)
  const { chain } = useAccount()
  const { addPubsubHandle } = useContext(ModerationServicesContext)
  const { db } = useContext(IDBContext)
  const [joined, setJoined] = useState(false)
  const [dial, setDial] = useState(null)
  const [dialErrors, setDialErrors] = useState([])

  const joinModerationService = useCallback(async () => {
    if ( helia && db && ms && chain?.id ) {  
      try {
        const baseUrl = `/chainId/${chain.id}/address/${ms.address}`
        console.log('baseUrl', baseUrl)
        await helia.libp2p.services.pubsub.addEventListener("message", async (event) => {
          console.log('gotpubsubmessage', event)
          const {topic ,data} = event.detail
          const json = JSON.parse(new TextDecoder().decode(data))
          console.log('topic', topic, json)
          if (topic === `${baseUrl}/ping`) {
            const exists = await db.moderationServices.where({
              chainId: Number(chain.id),
              address: ms.address
            }).count() > 0
            if (exists) {
              await db.moderationServices.where({
                chainId: Number(chain.id),
                address: ms.address
              }).modify({subscribed: 1})
            } else {


              await db.moderationServices.add({
                subscribed: 1,
                uri: ms.uri,
                name: ms.name,
                port: ms.port,
                address: ms.address,
                chainId: Number(chain.id),
                owner: ms.owner,
                orbitDbAddr: json.orbitDbAddr
              })
            }
          }
          await helia.libp2p.services.pubsub.removeEventListener("message", async () => {
            console.log('removed listener')
          })
        })

        const dial = await helia.libp2p.dial(multiaddr(`/dns4/${ms.uri}/tcp/${ms.port}/wss`))
        await helia.libp2p.services.pubsub.subscribe(baseUrl)
        await helia.libp2p.services.pubsub.subscribe(`${baseUrl}/ping`)
        setTimeout(async () => {
          console.log('publishing ping')
          await helia.libp2p.services.pubsub.publish(`${baseUrl}/ping`, null)
        }, 618)

        setDial(dial)

        setJoined(true)

      } catch (e) {
        console.log(e)
        setDialErrors(old => [...old, e.message])
      }
    }
  },[helia, db, ms, chain?.id])
  
  const leaveModerationService = useCallback(async () => {
    if ( helia && db && ms && chain?.id ) {  
      try {
        setJoined(false)
        setDial(null)
        helia.libp2p.services.pubsub.unsubscribe(ms.address)
        try {
          await db.moderationServices
            .where('[address+chainId]')
            .equals([ms.address,Number(chain.id)]).modify({subscribed: 0})
        } catch (e) {
          console.log(e)
          setDialErrors(old => [...old, e.message])
        }
      } catch (e) {
        console.log(e)
        setDialErrors(old => [...old, e.message])
      }
    }
  },[helia, db, ms, chain?.id])

  useEffect(() => {
    if (db) {
      const getJoined = async () => {
        const modService = await db.moderationServices.where('[address+chainId]').equals([ms.address, Number(chain.id)]).first()
        if (!modService) return
        if (modService.subscribed === 1) {
          setJoined(true)
        } else {
          setJoined(false)
        }
      }

      getJoined()
    }

  }, [db, chain?.id, ms.address])


  return {
    joined,
    joinModerationService,
    leaveModerationService,
    dial,
    dialErrors
  }
}

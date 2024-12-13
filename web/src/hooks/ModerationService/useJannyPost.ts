import { useState, useEffect, useCallback, useContext } from 'react'
import { useWalletClient, usePublicClient, useAccount } from 'wagmi'
import { useParams } from 'react-router-dom'
import { multiaddr  } from '@multiformats/multiaddr'
import { signTypedData } from '@wagmi/core'
import { config } from '@/config'

import { HeliaContext } from '@/provider/HeliaProvider'


export const useJannyPost = () => {
  const { helia } = useContext(HeliaContext)
  const [signature, setSignature] = useState(null)
  const [response, setResponse] = useState(null)
  const [logErrors, setLogErrors] = useState([])
  const { boardId, threadId } = useParams();

  const { address } = useAccount()
  const walletClient = useWalletClient()



  const jannyPost = useCallback(async (
    moderationService: any,
    postId: `0x${string}`,
    rule: number
  ) => {
    if (walletClient && boardId && threadId && helia && address) {
      // this is depending on signing taking enough time to establish a connection, not optimal
      const dial = await helia.libp2p.dial(multiaddr(`/dns4/${moderationService.uri}/tcp/${moderationService.port}/wss`))
      try {
        console.log('modservice', moderationService)
        const typedData = {
          domain: {
            name: moderationService.name,
            version: "1",
            chainId: moderationService.chainId,
            verifyingContract: moderationService.address
          },
          message: {
            chainId: moderationService.chainId,
            boardId: boardId,
            threadId: threadId,
            postId: postId,
            reason: rule
          },
          primaryType: 'FlagData',
          types: {
            EIP712Domain: [
              {name: "name", type: "string"},
              {name: "version", type: "string"},
              {name: "chainId", type: "uint256"},
              {name: "verifyingContract", type: "address"}
            ],
            FlagData: [
              {name: "chainId", type: "uint256"},
              {name: "boardId", type: "uint256"},
              {name: "threadId", type: "bytes32"},
              {name: "postId", type: "bytes32"},
              {name: "reason", type: "uint256"}
            ]
          }
        }
        console.log('typedData', typedData)

        const signature = await signTypedData(config, typedData)
        console.log('signature', signature)

        setSignature(signature)

        try {
          console.log('dial', dial)
          await helia.libp2p.services.pubsub.publish(
            'janitor',
            new TextEncoder().encode(
              JSON.stringify({
                address,
                ...typedData,
                signature
              })
            )
          )
        } catch (e) {
          console.log(e)
          setLogErrors(old => [...old, e.message])
        }



      } catch (e) {
        console.log(e)
        setLogErrors(old => [...old, e.message])
      }
    }
  }, [
    threadId,
    boardId,
    walletClient,
    helia,
    address
  ])


  return {
    jannyPost,
    signature,
    response,
    logErrors
  }
}

        


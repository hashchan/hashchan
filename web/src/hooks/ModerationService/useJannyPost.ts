import { useState, useEffect, useCallback, useContext } from 'react'
import { useWalletClient, usePublicClient, useAccount } from 'wagmi'
import { useParams } from 'react-router-dom'
import { multiaddr  } from '@multiformats/multiaddr'
import { signTypedData } from '@wagmi/core'
import { config } from '@/config'

import { ModerationServicesContext } from '@/provider/ModerationServicesProvider'
import { HeliaContext } from '@/provider/HeliaProvider'
export const useJannyPost = () => {
  const [signature, setSignature] = useState(null)
  const [response, setResponse] = useState(null)
  const [logErrors, setLogErrors] = useState([])
  const { boardId, threadId } = useParams();

  //const { moderationServices } = useContext(ModerationServicesContext)
  const { helia } = useContext(HeliaContext)
  const { address } = useAccount()
  const walletClient = useWalletClient()



  const jannyPost = useCallback(async (
    moderationService: any,
    postId: `0x${string}`,
    rule: number
  ) => {
    if (walletClient && boardId && threadId  && address && helia) {
      // this is depending on signing taking enough time to establish a connection, not optimal
      try {
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
          //probly should be chainId + address to guarantee cross chain uniqueness
          console.log('publish', moderationService.address)
          await helia.libp2p.services.pubsub.publish(
            `/chainId/${moderationService.chainId}/address/${moderationService.address}`,
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
    helia,
    boardId,
    walletClient,
    address
  ])


  return {
    jannyPost,
    signature,
    response,
    logErrors
  }
}

        


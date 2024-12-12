import { useState, useEffect, useCallback } from 'react'
import { useWalletClient, usePublicClient, useAccount } from 'wagmi'
import { useParams } from 'react-router-dom'

import { signTypedData } from '@wagmi/core'
import { config } from '@/config'
export const useJannyPost = () => {
  const [signature, setSignature] = useState(null)
  const [response, setResponse] = useState(null)
  const [logErrors, setLogErrors] = useState([])
  const { boardId, threadId } = useParams();

  const { address } = useAccount()
  const walletClient = useWalletClient()
  const publicClient = usePublicClient();

  const jannyPost = useCallback(async (
    moderationService: any,
    postId: `0x${string}`,
    rule: number
  ) => {
    if (walletClient && boardId && threadId) {
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

      } catch (e) {
        console.log(e)
        setLogErrors(old => [...old, e.message])
      }
    }
  }, [
    threadId,
    boardId,
    walletClient
  ])


  return {
    jannyPost,
    signature,
    response,
    logErrors
  }
}

        


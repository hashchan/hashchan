import { useMutation } from '@tanstack/react-query'
import { useAccount, useWalletClient } from 'wagmi'
import { useParams } from 'react-router-dom'
import { signTypedData } from '@wagmi/core'
import { useContext } from 'react'
import { config } from '@/config'
import { HeliaContext } from '@/provider/HeliaProvider'

interface ModerationService {
  address: `0x${string}`
  chainId: number
  name: string
}

interface JannyPostParams {
  moderationService: ModerationService
  postId: `0x${string}`
  rule: number
}

export const useJannyPost = () => {
  const { boardId, threadId } = useParams()
  const { chain } = useAccount()
  const { address } = useAccount()
  const { helia } = useContext(HeliaContext)

  const jannyPostMutation = useMutation({
    mutationFn: async ({ moderationService, postId, rule }: JannyPostParams) => {
      if (!boardId || !threadId || !address || !helia || !chain?.id) {
        throw new Error('Missing required dependencies')
      }

      // Create the typed data for signing
      const typedData = {
        domain: {
          name: moderationService.name,
          version: "1",
          chainId: chain.id,
          verifyingContract: moderationService.address
        },
        message: {
          chainId: chain.id,
          boardId: boardId,
          threadId: threadId,
          postId: postId,
          reason: rule
        },
        primaryType: 'FlagData',
        types: {
          EIP712Domain: [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" }
          ],
          FlagData: [
            { name: "chainId", type: "uint256" },
            { name: "boardId", type: "uint256" },
            { name: "threadId", type: "bytes32" },
            { name: "postId", type: "bytes32" },
            { name: "reason", type: "uint256" }
          ]
        }
      }

      try {
        // Sign the data
        const signature = await signTypedData(config, typedData)

        // Publish to libp2p pubsub
        const topic = `/chainId/${moderationService.chainId}/address/${moderationService.address}`
        const message = {
          address,
          ...typedData,
          signature
        }

        await helia.libp2p.services.pubsub.publish(
          topic,
          new TextEncoder().encode(JSON.stringify(message))
        )

        return {
          signature,
          topic,
          message
        }
      } catch (error) {
        // Enhance error with context
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        throw new Error(`Failed to process janny post: ${errorMessage}`)
      }
    }
  })

  return {
    jannyPost: jannyPostMutation.mutate,
    isLoading: jannyPostMutation.isPending,
    error: jannyPostMutation.error,
    // Return the signature from the mutation data
    signature: jannyPostMutation.data?.signature,
    reset: jannyPostMutation.reset,
    // For debugging/monitoring purposes
    data: jannyPostMutation.data
  }
}

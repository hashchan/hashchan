import { useMutation } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { useParams } from 'react-router-dom'
import { signTypedData } from '@wagmi/core'
import { useContext } from 'react'
import { config } from '@/config'
import { HeliaContext } from '@/provider/HeliaProvider'
import { multiaddr } from '@multiformats/multiaddr'
import { lpStream } from '@libp2p/utils'

interface ModerationService {
  address: `0x${string}`
  chainId: number
  name: string
  uri: string
  port: number
}

interface JannyPostParams {
  moderationService: ModerationService
  postId: `0x${string}`
  rule: number
}

export const useJannyPost = () => {
  const { boardId, threadId } = useParams()
  const { chain, address } = useAccount()
  const { helia } = useContext(HeliaContext)

  const jannyPostMutation = useMutation({
    mutationFn: async ({ moderationService, postId, rule }: JannyPostParams) => {
      if (!boardId || !threadId || !address || !helia || !chain?.id) {
        throw new Error('Missing required dependencies')
      }

      const topic = `/chainId/${moderationService.chainId}/address/${moderationService.address}`

      const typedData = {
        domain: {
          name: moderationService.name,
          version: "1",
          chainId: chain.id,
          verifyingContract: moderationService.address
        },
        message: {
          chainId: chain.id,
          boardId: Number(boardId),
          threadId,
          postId,
          reason: Number(rule)
        },
        primaryType: 'FlagData' as const,
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

      const signature = await signTypedData(config, typedData)

      const payload = {
        topic,
        address,
        ...typedData,
        signature
      }

      const ma = multiaddr(`/dns4/${moderationService.uri}/tcp/${moderationService.port}/wss`)
      const stream = await helia.libp2p.dialProtocol(ma, '/hashchan/janny/1.0.0')
      const lp = lpStream(stream)

      await lp.write(new TextEncoder().encode(JSON.stringify(payload)))
      const msg = await lp.read()
      const response = JSON.parse(new TextDecoder().decode(msg.subarray()))

      if (!response.success) {
        throw new Error(response.error ?? 'Janny post rejected by moderation service')
      }

      return response
    }
  })

  return {
    jannyPost: jannyPostMutation.mutate,
    isLoading: jannyPostMutation.isPending,
    error: jannyPostMutation.error,
    response: jannyPostMutation.data,
    reset: jannyPostMutation.reset
  }
}

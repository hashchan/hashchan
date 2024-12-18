import { 
  useState,
  useEffect,
  useCallback,
  useContext
} from 'react'

import { parseEther } from 'viem'

import { useModerationServices } from '@/hooks/ModerationService/useModerationServices'
export const useReviewJanny = ({
  jannyTypedData,
}: {
  jannyTypedData: object,
}) => {
  console.log('jannyTypedData', jannyTypedData)
  const { moderationServices } = useModerationServices({
    filter: {
      where: '[address+chainId]',
      equals: [
        jannyTypedData.domain.verifyingContract,
        jannyTypedData.domain.chainId
      ]
    }
  })
  const [hash, setHash] = useState(null)
  const [logs, setLogs] = useState([])
  const [logErrors, setLogErrors] = useState([])

  const reviewJanny = useCallback(async ({
    isPositive,
    review,
    tip
  }:{
    isPositive: boolean
    review: string
    tip: string
  }) => {
    if (moderationServices.length === 0) return
    const instance = moderationServices[0].instance
    const unwatch = instance.watchEvent.ReviewAdded(
      {
        janitor: jannyTypedData.address,
        postId: jannyTypedData.message.postId
      },
      {
        onLogs: (logs) => {
          console.log('logs', logs)
          setLogs(old => [...old, ...logs])
          unwatch()
        },
        onError: (error) => {
          console.log('error', error)
          setLogErrors(old => [...old, error])
        }
      }
    )

    const hash = await instance.write.addReview([
      jannyTypedData.address,
      isPositive,
      review,
      jannyTypedData.signature,
      jannyTypedData.message
    ], {
      value: parseEther(tip.toString())
    })
    setHash(hash)

  }, [
    moderationServices,
    jannyTypedData
  ])



  return {
    reviewJanny,
    hash,
    logs,
    logErrors
  }
}

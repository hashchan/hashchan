import { 
  useState,
  useEffect
} from 'react'
import { useForm } from "react-hook-form";
import { useReviewJanny } from '@/hooks/ModerationService/useReviewJanny'
import { truncateEthAddress } from '@/utils/address'
import { Modal } from '@/components/Modal'
import { useBoard } from '@/hooks/HashChan/useBoard'
import { GiMagicBroom } from 'react-icons/gi'

export const ReviewJanny = ({
  jannyTypedData,
}: {
  jannyTypedData: object,
}) => {
  const [wait, setWait] = useState(0)
  const { board } = useBoard()
  const { reviewJanny, hash, logs, logErrors } = useReviewJanny({
    jannyTypedData
  })
  const [isOpen, setIsOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const { register, handleSubmit, formState: { errors  }  } = useForm({
    defaultValues: {
      isPositive: '',
      review: '',
      tip: 1/(Math.PHI * 10)
    }
  });

  const handleClose = () => {
    setIsOpen(old => !old)
  }

  const onSubmit = async (data) => {
    await reviewJanny({
      isPositive: data.isPositive == 'positive' ? true : false,
      review: data.review,
      tip: data.tip
    })
  }
  
  useEffect(() => {
    if (hash?.length) {
      setWait(2)
    }
  }, [hash])

  useEffect(() => {
    if (logs.length > 0) {
      setWait(3)
    }
  }, [logs])

  return (
    <>
      <button onClick={() => setIsOpen(old => !old)}>
        Rate Janitor
      </button>
      {isOpen &&
      <Modal name="Review Janitor" handleClose={handleClose}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-wrap-center"
          style={{
            flexDirection: 'column',
          }}
        >
          <label htmlFor="isPositive">Review Type</label>
          <div style={{
            width:`${100/(Math.PHI)+(100/(Math.PHI**3))}%`, 
            }}>
            <label htmlFor="isPositive">Positive: 
              <input
                type="radio"
                value="positive"
                {...register("isPositive", { required: true })}
              />
            </label>
            <label htmlFor="isPositive">Negative:
              <input
                type="radio"
                value="negative"
                {...register("isPositive", { required: true })}
              />
            </label>
          </div>
          <label htmlFor="amount">Review: </label>
          <div style={{
            width:`${100/(Math.PHI)+(100/(Math.PHI**3))}%`,
            }}
          >
            <input
              style={{
                paddingLeft: 0,
                paddingRight: 0,
                margin: '4px 0',
                width: '100%',
              }}
              {...register("review", { required: false })}
            /> 
          </div>
          <div style={{
            width:`${100/(Math.PHI)+(100/(Math.PHI**3))}%`,
            }}
          >
            <input
              style={{
                paddingLeft: 0,
                paddingRight: 0,
                margin: '4px 0',
                width: '100%',
              }}
              {...register("tip", { required: false })}
            /> 
          </div>
          <button type="submit">Review Janitor</button>

          <div>
            {(wait > 0 ) && <label htmlFor="hash">Hash:</label>}
            {(wait > 0 && !hash ) && <p>waiting for wallet confirmation...</p>}
            {hash && (
              <p className="break-words">{hash}</p>
            )}
            {(wait > 1) && <label htmlFor="logs">confirmation:</label>}
            {(wait > 1 && logs.length === 0) && <p>waiting for tx confirmation...</p>}
            { logs.length > 0 &&
              <p className="break-words">{logs[0].transactionHash ? 'successful' : 'failed'}</p>
            }
            {logErrors.map((log, i) => {
              return (
                <p className="break-words" key={i}>{log.toString()}</p>
              )
            })}
          </div>
        </form>
      </Modal>
      }
    </>
  )
}

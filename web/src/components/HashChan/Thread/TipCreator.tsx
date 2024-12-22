import { 
  useState,
  useEffect
} from 'react'
import { useForm } from "react-hook-form";
import { FaHandHoldingDollar } from "react-icons/fa6";

import { useTip } from '@/hooks/useTip'

import { Modal } from '@/components/Modal'
import { TxResponse} from '@/components/TxResponse'

export const TipCreator = ({creator}: {creator: `0x${string}`}) => {
  const [wait, setWait] = useState(0)
  const { createTip, hash, logs, logErrors } = useTip()
  const [isOpen, setIsOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const { register, handleSubmit, formState: { errors  }  } = useForm();

  const handleClose = () => {
    setIsOpen(old => !old)
  }

  const onSubmit = async (data) => {
    setWait(1)
    await createTip(
      creator,
      data.amount
    )
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
      <span
        onClick={handleClose}
        style={{
          paddingLeft: `${1/ Math.PHI}vw`,
          color: hovered ? '#20c20E': 'white',
        }}
      >
        <FaHandHoldingDollar />
      </span>

      {isOpen &&
        <Modal name="Tip Creator" handleClose={handleClose}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex-wrap-center"
            style={{
              flexDirection: 'column',
            }}
          >
            <label htmlFor="amount">Tip Amount</label>
            <div style={{
              width:`${100/(Math.PHI)+(100/(Math.PHI**3))}%`
              }}
            >
              <input style={{
                paddingLeft: 0,
                paddingRight: 0,
                margin: '4px 0',
                width: '100%',
              }}
              defaultValue={(Math.PHI)/100} {...register("amount", { required: true })} />
              {errors.amount && <span>This field is required</span>}
            </div>
            <button type="submit">Tip</button>
          </form>
          <TxResponse wait={wait} hash={hash} logs={logs} logErrors={logErrors} />
        </Modal>
      }
    </>
  )
}

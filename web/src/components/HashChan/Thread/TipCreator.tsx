import { 
  useState,
} from 'react'
import { useForm } from "react-hook-form";
import { FaHandHoldingDollar } from "react-icons/fa6";

import { useTip } from '@/hooks/useTip'

import { Modal } from '@/components/Modal'

export const TipCreator = ({creator}: {creator: `0x${string}`}) => {
  const { createTip, hash, receipt, error } = useTip()
  const [isOpen, setIsOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const { register, handleSubmit, formState: { errors  }  } = useForm();

  const handleClose = () => {
    setIsOpen(old => !old)
  }

  const onSubmit = async (data) => {
    const response = await createTip(
      creator,
      data.amount
    )
    if (response.hash) {
      console.log('response', response)
    } else {
      console.log('error', response.error.message)
    }
  }

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
        <Modal handleClose={handleClose}>
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
          {hash && <p>Transaction hash: {truncateEthAddress(hash)}</p>}
          {receipt && <p>Transaction receipt: {receipt.status}</p>}
          {error && <div 
            style={{ backgroundColor: 'red', position: 'absolute' }}
          >{error}</div>}
        </Modal>
      }
    </>
  )
}

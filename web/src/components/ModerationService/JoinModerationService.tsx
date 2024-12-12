import { useState, useEffect } from 'react'
import { useForm  } from "react-hook-form";
import { Modal } from '@/components/Modal'
import { useJoinModerationService } from '@/hooks/ModerationService/useJoinModerationService'
export const JoinModerationService = ({ms}: {ms: any}) => {
  const [isOpen, setIsOpen] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm();

  const {
    dial,
    joinModerationService,
    dialErrors
  } = useJoinModerationService(ms)

  const [wait, setWait] = useState(0)

  const handleClose = () => {
    setIsOpen(old => !old)
  }

  const onSubmit = async (data) => {
    setWait(1)
    await joinModerationService()
  }

  useEffect(() => {
    if (dial) setWait(2)
  }, [dial])


  return (
    <>
      <button onClick={handleClose}>Subscribe</button>
      { isOpen &&
      <Modal handleClose={handleClose}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-wrap-center"
          style={{
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div>
            <button
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (<span>Submitting...</span>): (<span>Subscribe To Moderation Service</span>)}
            </button>
          </div>
        <div>
        {(wait > 0 ) && <label htmlFor="hash">Dailing:</label>}
        {(wait > 1) && <label htmlFor="logs">connected!</label>}
        {dialErrors.map((e, i) => <div key={i}>{e}</div>)}
        </div>
      </form>
    </Modal>
    }
  </>
  )
}

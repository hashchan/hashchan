import { useState, useEffect, useContext } from 'react'
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
    joined,
    dial,
    joinModerationService,
    leaveModerationService,
    dialErrors
  } = useJoinModerationService(ms)

  const [wait, setWait] = useState(0)

  const handleClose = () => {
    setIsOpen(old => !old)
  }

  const onSubmit = async (data) => {
    setWait(1)
    if (joined) {
      await leaveModerationService()
    } else {
      await joinModerationService()

    }
  }

  useEffect(() => {
    if (dial) setWait(2)
  }, [dial])

  useEffect(() => {
    if (joined) setWait(3)
  }, [joined])


  return (
    <>
      <button onClick={handleClose}>{joined ? 'UnSubscribe' : 'Subscribe'}</button>
      { isOpen &&
      <Modal name="Join Moderation Service" handleClose={handleClose}>
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
              {isSubmitting ? (<span>Submitting...</span>): (<span>{
                joined ? 'Unsubscribe' : 'Subscribe'
              }</span>)}
            </button>
          </div>
        <div>
        {(wait > 0 && !joined ) && <label htmlFor="hash">Dailing:</label>}
        {(wait > 1) && <label htmlFor="logs">{dial ? 'Dialed: awaiting orbit db connection' : 'Disconnected'}!</label>}
        {(wait > 2) && <div>{joined ? 'Connected' : 'Disconnected'}!</div>}
        {dialErrors.map((e, i) => <div key={i}>{e}</div>)}
        </div>
      </form>
    </Modal>
    }
  </>
  )
}

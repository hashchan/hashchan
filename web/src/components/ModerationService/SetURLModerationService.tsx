import { useState, useEffect } from 'react'
import { useForm  } from "react-hook-form";
import { Modal } from '@/components/Modal'
import { useEditModerationService } from '@/hooks/ModerationService/useEditModerationService'

import { TxResponse} from '@/components/TxResponse'
export const SetURLModerationService = ({instance}:{instance: any}) => {
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
    editUrl,
    hash,
    logs,
    logErrors,
  } = useEditModerationService(instance)

  const [wait, setWait] = useState(0)

  const handleClose = () => {
    setIsOpen(old => !old)
  }

  const onSubmit = async (data) => {
    setWait(1)
    await editUrl({
      uri: data.uri,
      port: data.port,
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
      <button onClick={handleClose}>Set URL</button>
      { isOpen &&
      <Modal name="Set URL" handleClose={handleClose}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-wrap-center"
          style={{
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <label htmlFor="url">Orbit DB URI</label>
          <div style={{
            width: `${100/(Math.PHI)+(100/(Math.PHI**3))}%`
            }}>
            <input style={{
              paddingLeft: 0,
              paddingRight: 0,
              margin: '4px 0',
              width: '100%',
              }}
              defaultValue="" {...register("uri", { required: true })} />
          </div>
          <label htmlFor="url">orbit db port</label>
          <div style={{
            width: `${100/(Math.PHI)+(100/(Math.PHI**3))}%`
            }}>
            <input style={{
              paddingLeft: 0,
              paddingRight: 0,
              margin: '4px 0',
              width: '100%',
              }}
              defaultValue="" {...register("port", { required: true })} />
          </div>
          <div>
            <button
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (<span>Submitting...</span>): (<span>Update URL</span>)}
            </button>
          </div>
        <div>
        <TxResponse hash={hash} logs={logs} logErrors={logErrors} wait={wait} />
        </div>
      </form>
    </Modal>
    }
  </>
  )
}

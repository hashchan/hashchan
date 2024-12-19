import { useState, useEffect } from 'react'
import { useForm  } from "react-hook-form";
import { Modal } from '@/components/Modal'
import { useEditModerationService } from '@/hooks/ModerationService/useEditModerationService'
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
      <Modal handleClose={handleClose}>
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
        {(wait > 0 ) && <label htmlFor="hash">Hash:</label>}
        {(wait > 0 && !hash ) && <p>waiting for wallet confirmation...</p>}
          {hash && (
            <p className="break-words">{hash}</p>
          )}
          {(wait > 1) && <label htmlFor="logs">confirmation:</label>}
          {(wait > 1 && logs.length === 0) && <p>waiting for tx confirmation...</p>}
          {logs.map((log, i) => {
            return (
              <>
                <p className="break-words" key={i}>{log.transactionHash ? 'successful' : 'failed'}</p>
              </>
          )})}
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

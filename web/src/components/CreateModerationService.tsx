import { useState } from 'react'
import { useForm  } from "react-hook-form";
import { Modal } from '@/components/Modal'
import { useCreateModerationService } from '@/hooks/ModerationService/useCreateModerationService'
export const CreateModerationService = () => {
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
    createModerationService,
    hash,
    receipt,
    logErrors,
  } = useCreateModerationService()

  const handleClose = () => {
    setIsOpen(old => !old)
  }

  const onSubmit = async (data) => {
    await createModerationService({
      name: data.name,
      uri: data.uri,
      port: data.port,
    })
  }

  return (
    <>
      <button onClick={handleClose}>Create Moderation Service</button>
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
          <label htmlFor="name">Moderation Service Name</label>
          <div style={{
            width: `${100/(Math.PHI)+(100/(Math.PHI**3))}%`
            }}>
            <input style={{
              paddingLeft: 0,
              paddingRight: 0,
              margin: '4px 0',
              width: '100%',
              }}
              defaultValue="" {...register("name", { required: true })} />
          </div>
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
              defaultValue="" {...register("url", { required: true })} />
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
              type="submit">
              {isSubmitting ? (<span>Submitting...</span>): (<span>Create Moderation Service</span>)}
              </button>
              {logErrors && (<p style={{
                wordBreak: 'break-all',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'break-word'
              }}>{logErrors}</p>)}
              </div>
              </form>
              </Modal>
      }
      </>
  )
}

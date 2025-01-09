import { 
  useState,
  useEffect,
} from 'react'
import { useForm } from "react-hook-form";
import { useW3Storage } from '@/hooks/useW3Storage'
import { Modal } from '@/components/Modal'

const ConnectPinningProviderModal = ({handleClose}:{handleClose : () => void }) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting  }  } = useForm();

    const {
      emailWaiting,
      loginUser,
    } = useW3Storage()

    const onSubmit = async (data) => {
      await loginUser(data.privateKey, data.email)
    }

    const width = `${100/(Math.PHI)+(100/(Math.PHI**3))}%`
    return (
      <Modal name="Connect Pinning Service" handleClose={handleClose}>
        <form
          className="flex-wrap-center"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onSubmit={handleSubmit(onSubmit)}
        >

          <label htmlFor="name">Pinning Service URL</label>
          <div style={{width}}>
            <input 
              className="modal-form-input"
              defaultValue="" {...register("url", { required: true })} />
            {errors.url && <span>This field is required</span>}
          </div>
          <label htmlFor="name">API Key</label>
          <div style={{width}}>
            <input 
              className="modal-form-input"
              defaultValue="" {...register("key", { required: true })} />
            {errors.key && <span>This field is required</span>}
          </div>
          <button
            disabled={isSubmitting}
            type="submit">
            {isSubmitting ? (
              <span>Submitting...</span>
            ): (<span>Connect Pinning Service</span>)
            }
          </button>
        </form>
      </Modal>
    )
}



export const ConnectPinningProvider = () => {
  const [showModal, setShowModal] = useState(false)
  const handleShowModal = () => {
    setShowModal(!showModal)
  }
  //const { account } = useW3Storage()
  return (<>
    <button
      onClick={() => handleShowModal()}
    >
      {account ? account.model.id: 'Connect W3Storage'}
    </button>
    {showModal && <ConnectPinningProviderModal handleClose={handleShowModal} />}
  </>)
}

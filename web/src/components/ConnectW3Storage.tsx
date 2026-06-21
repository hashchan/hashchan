import { 
  useState,
  useEffect,
} from 'react'
import { useForm } from "react-hook-form";
import { useW3Storage } from '@/hooks/useW3Storage'
import { Modal } from '@/components/Modal'

const ConnectW3StorageModal = ({handleClose}:{handleClose : () => void }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting  }  } = useForm();

    const {
      emailWaiting,
      loginUser,
    } = useW3Storage()

    const onSubmit = async (data) => {
      await loginUser(data.email)
    }


    return (
        <Modal name="Connect Storacha" handleClose={handleClose}>
          <form
            className="flex-wrap-center"
            style={{
              flexDirection: 'column',
            }}
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex-wrap-center"
              style={{
                flexDirection: 'column',
              }}>
              <h3>Create an <i>optional</i> Ephemeral <a target="_blank" href="https://storacha.network">Storacha</a> Session</h3>
              <p>Storacha is an IPFS pinning provider. Sign up at <a target="_blank" href="https://storacha.network">storacha.network</a> first, then enter your email below to connect.</p>
              <label htmlFor="email">Email</label>
              <input style={{width:'261px'}} defaultValue="" {...register("email", { required: true })} />
              {errors.email && <span>This field is required</span>}
              <button disabled={isSubmitting} type="submit">Submit</button>
              { emailWaiting && <p>logging in... please check your email to register with Storacha</p> }
            </div>
          </form>
        </Modal>
    )
}



export const ConnectW3Storage = () => {
  const [showModal, setShowModal] = useState(false)
  const handleShowModal = () => {
    setShowModal(!showModal)
  }
  const { account } = useW3Storage()
  return (<>
    <button
      onClick={() => handleShowModal()}
    >
      {account ? account.model.id: 'Connect Storacha'}
    </button>
    {showModal && <ConnectW3StorageModal handleClose={handleShowModal} />}
  </>)
}

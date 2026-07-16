import { 
  useState,
  useEffect,
} from 'react'
import { useForm } from "react-hook-form";
import { useW3Storage } from '@/hooks/useW3Storage'
import { Modal } from '@/components/Modal'

// Storacha's maintainers have gone quiet and the service's status is
// uncertain. Disabled pending confirmation it still works; this is the only
// gate to flip (or remove, along with this file/hook/provider) later.
const STORACHA_DISABLED = true

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



// Dropdown-item trigger only — the currently active provider's name is shown
// by the composition layer (useActivePinningProvider) directly in the nav
// bar, not duplicated here.
export const ConnectW3Storage = () => {
  const [showModal, setShowModal] = useState(false)
  const handleShowModal = () => {
    setShowModal(!showModal)
  }
  const { account } = useW3Storage()
  return (<>
    <button
      disabled={STORACHA_DISABLED}
      title={STORACHA_DISABLED ? 'Storacha is temporarily unavailable' : undefined}
      onClick={() => handleShowModal()}
    >
      {account ? 'Storacha ✓' : 'Storacha'}
    </button>
    {showModal && <ConnectW3StorageModal handleClose={handleShowModal} />}
  </>)
}

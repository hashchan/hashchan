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
    setValue,
    formState: { errors, isSubmitting  }  } = useForm();

    const {
      emailWaiting,
      loginUser,
    } = useW3Storage()

    const onSubmit = async (data) => {
      await loginUser(data.privateKey, data.email)
    }


    return (
        <Modal handleClose={handleClose}>
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
              <h3>Create an <i>optional</i> Epheremeral <a target="_blank" href="https://web3.storage">W3Storage</a> Session</h3>
              <p>web3.storage is an ipfs pinning provider, if your comfortable providing your email to them this makes adding images to your posts more convenient</p>
              <label htmlFor="email">Email</label>
              <input style={{width:'261px'}} defaultValue="" {...register("email", { required: true })} />
              {errors.email && <span>This field is required</span>}
              <label htmlFor="privateKey">PrivateKey</label>
              <p>you can create this with <u>npx ucan-key ed --json</u></p>
              <input style={{width:'261px'}} defaultValue="" {...register("privateKey", { required: true })} />
              {errors.privateKey && <span>This field is required</span>}
              <button disabled={isSubmitting} type="submit">Submit</button>
              { emailWaiting && <p>logging in... please check your email to register with web3.storage</p> }
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
      {account ? account.model.id: 'Connect W3Storage'}
    </button>
    {showModal && <ConnectW3StorageModal handleClose={handleShowModal} />}
  </>)
}

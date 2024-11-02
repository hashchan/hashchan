import { 
  useState,
  useEffect,
} from 'react'
import { useForm } from "react-hook-form";
import { useW3Storage } from '@/hooks/useW3Storage'


const ConnectW3StorageModal = () => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting  }  } = useForm();

  const {
    emailWaiting,
    principal,
    store,
    client,
    account,
    space,
    loginUser,
    uploadFile
  } = useW3Storage()

  const onSubmit = async (data) => {
    await loginUser(data.privateKey, data.email)
  }


  return (
    <div
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{
          //overlapping modal css
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor:"#090909",
          padding: '0.618vh 0.618vw',
        }}
      >
        <label htmlFor="email">Email</label>
        <input style={{width:'5vw'}} defaultValue="" {...register("email", { required: true })} />
        {errors.email && <span>This field is required</span>}
        <label htmlFor="privateKey">PrivateKey</label>
        <input style={{width:'5vw'}} defaultValue="" {...register("privateKey", { required: true })} />
        {errors.privateKey && <span>This field is required</span>}
        <input type="submit" />
      { emailWaiting && <p>logging in... please check your email to register with web3.storage</p> }
      </form>
    </div>
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
      style={{
        padding: '0.618vh 0.618vw',
        margin: '0.618vh 0.618vw',
      }}
      onClick={() => handleShowModal()}
    >
      {account ? account.model.id: 'Connect W3Storage'}
    </button>
    {showModal && <ConnectW3StorageModal />}
  </>)
}

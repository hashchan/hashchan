import { useState } from 'react'
import { useForm  } from "react-hook-form";
import { useCreateBoard } from "@/hooks/useCreateBoard";
import { Modal } from '@/components/Modal'

export const CreateBoard = ({
  handleClose
}:{
  handleClose : () => void 
}) => {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting  }  } = useForm();

  const { createBoard } = useCreateBoard()

  const [rpcError, setRpcError] = useState(null)
  const onSubmit = async (data) => {
    const {receipt, error } = await createBoard(
      data.name,
      data.symbol
    )
    if (receipt) {
      console.log('receipt', receipt)
      handleClose()
    } else {
      setRpcError(error.message)
      console.log('error')
    }
  }

  return (
    <Modal handleClose={handleClose}>
      <form
        className="flex-wrap-center"
        style={{
          flexDirection: 'column',
        }}
        onSubmit={handleSubmit(onSubmit)}>
          <label htmlFor="name">Board Name</label>
          <input style={{width:'38.2vw'}} defaultValue="" {...register("name", { required: true })} />
          {errors.name && <span>This field is required</span>}
          <label htmlFor="content">Symbol </label>
          <input style={{width:'38.2vw'}} defaultValue="" {...register("symbol", { required: true })} />
          {errors.symbol && <span>This field is required</span>}
        <div>
          <button
            disabled={isSubmitting}
            type="submit">
            {isSubmitting ? (<span>Submitting...</span>): (<span>Create Board</span>)}
            </button>
            {rpcError && (<p style={{
              wordBreak: 'break-all',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word'
            }}>{rpcError}</p>)}
            </div>
            </form>
    </Modal>
  );
}



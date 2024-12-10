import { useState } from 'react'
import { useForm  } from "react-hook-form";
import { useCreateBoard } from "@/hooks/HashChan/useCreateBoard";
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
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onSubmit={handleSubmit(onSubmit)}
      >
        <label htmlFor="name">Board Name</label>
        <div style={{
            width:`${100/(Math.PHI)+(100/(Math.PHI**3))}%`
          }}>
          <input style={{
              paddingLeft: 0,
              paddingRight: 0,
              margin: '4px 0',
              width: '100%',
            }}
            defaultValue="" {...register("name", { required: true })} />
          {errors.name && <span>This field is required</span>}
        </div>
        <label htmlFor="content">Symbol </label>
        <div
          style={{
            width:`${100/(Math.PHI)+(100/(Math.PHI**3))}%`
          }}
        >
        <input style={{
            paddingLeft: 0,
            paddingRight: 0,
            margin: '4px 0',
            width: '100%',
          }}
          defaultValue="" {...register("symbol", { required: true })} />
        {errors.symbol && <span>This field is required</span>}
</div>
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



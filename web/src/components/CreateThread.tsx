import { useEffect, useState } from 'react'
import { useForm  } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useCreateThread } from "@/hooks/useCreateThread";
export const CreateThread = ({board}: {board: string}) => {
  const { register, handleSubmit, formState: { errors  }  } = useForm();
  const { createThread, threadId } = useCreateThread()
  const [rpcError, setRpcError] = useState(null)
  const navigate = useNavigate();
  const onSubmit = async (data) => {
    console.log(data)
    const response = await createThread(
      board,
      data.title,
      data.imageUrl,
      data.content
    )
    console.log('response', response)
    if (response.hash) {
      navigate(`/boards/${board}/thread/${response.hash}`)
    } else {
      setRpcError(response.error.message)
      console.log('error')
    }
    //go to /boards/:board/thread/:thread using react-router-dom
  }

  useEffect(() => {}, [threadId])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="title">Title</label>
      <div>
        <input style={{width:'60vw'}} defaultValue="" {...register("title")} />
      </div>
      <label htmlFor="imageUrl">Image Url</label>
      <div>
      <input style={{width:'60vw'}} defaultValue="" {...register("imageUrl", { required: true })} />
      {errors.imageUrl && <span>This field is required</span>}
      </div>
      <label htmlFor="content">Content</label>
      <div>
        <textarea style={{width:'60vw', height:'120px'}} defaultValue="" {...register("content", { required: true  })} />
        {errors.content && <span>This field is required</span>}
      </div>
      <div>
        <input type="submit" />
        {rpcError && <p>{rpcError}</p>}
      </div>
    </form>

  );
}



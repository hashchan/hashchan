import { useEffect, useState } from 'react'
import { useForm  } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useCreateThread } from "@/hooks/useCreateThread";
import MarkdownEditor from '@uiw/react-markdown-editor';

export const CreateThread = ({board}: {board: string}) => {

  const { register, handleSubmit, formState: { errors, isSubmitting  }, setValue  } = useForm();
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
    <form 
      className="flex-wrap-center"
      style={{
        margin: '0 auto',
        flexDirection: 'column',
        width: '85.4vw',
        backgroundColor: "rgba(0,0,0,0.618)",
        borderRadius: '16px',
        border: '1px solid #20C20E',
      }}
      onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="title">Title</label>
      <div>
        <input style={{width:'61.8vw'}} defaultValue="" {...register("title", { required: true })} />
      {errors.title && <span>This field is required</span>}
      </div>
      <label htmlFor="imageUrl">Image Url</label>
      <div>
      <input style={{width:'61.8vw'}} defaultValue="" {...register("imageUrl", { required: true })} />
      {errors.imageUrl && <span>This field is required</span>}
      </div>
      <label htmlFor="content">Content</label>
      <div>
        <MarkdownEditor
          {...register("content", { required: true  })}
          height= '23.6vh'
          width="61.8vw"
          onChange={(value, viewUpdate) => {
             setValue('content', value)
          }} 
        />
        {errors.content && <span>This field is required</span>}
      </div>
      <div>
        <button
          disabled={isSubmitting}
          type="submit">
          {isSubmitting ? (<span>Submitting...</span>): (<span>Make Post</span>)}
          </button>
        {rpcError && <p>{rpcError}</p>}
      </div>
    </form>

  );
}



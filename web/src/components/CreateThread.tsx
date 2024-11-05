import { useEffect, useState } from 'react'
import { useForm  } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useCreateThread } from "@/hooks/useCreateThread";
import { useW3Storage } from '@/hooks/useW3Storage'
import MarkdownEditor from '@uiw/react-markdown-editor';

export const CreateThread = ({board}: {board: string}) => {
  const {  account, uploadFile } = useW3Storage()
  const { register, handleSubmit, formState: { errors, isSubmitting  }, setValue  } = useForm();
  const { createThread, threadId } = useCreateThread()
  const [rpcError, setRpcError] = useState(null)
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    console.log(data)
    let response;
    if  (data.imageUrl) {
      response = await createThread(
        board,
        data.title,
        data.imageUrl,
        data.content
      )
    } else if (data.w3Image) {
      const upload = await uploadFile(data.w3Image)
      console.log('upload', upload)
      response = await createThread(
        board,
        data.title,
        upload,
        data.content
      )
    } 
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
      className="flex-wrap-center overlay"
      style={{
        margin: '0 auto',
        flexDirection: 'column',
        width: '85.4vw',
      }}
      onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="title">Title</label>
      <div>
        <input style={{width:'61.8vw'}} defaultValue="" {...register("title", { required: true })} />
      {errors.title && <span>This field is required</span>}
      </div>
      <label htmlFor="imageUrl">Image Url</label>
      <div>
      {account?.model?.id && <input type="file" {...register("w3Image", { required: false })} />}
      <input style={{width:'61.8vw'}} defaultValue="" {...register("imageUrl", { required: false })} />
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



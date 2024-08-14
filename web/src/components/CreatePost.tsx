import { useState } from 'react'
import { useForm  } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useThread } from "@/hooks/useThread";
import { truncateEthAddress } from '@/utils'


export const CreatePost = ({
  threadId, replyIds, handleClose}:
    {threadId: string, replyIds: string[], handleClose : () => void }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting  }  } = useForm();
  const { createPost, fetchLatestPosts } = useThread(threadId)
  const navigate = useNavigate();
  const [rpcError, setRpcError] = useState(null)
  const onSubmit = async (data) => {
    console.log(data)
    const response = await createPost(
      data.imageUrl,
      data.content
    )
    if (response.hash) {
      console.log('response', response)

    } else {
      setRpcError(response.error.message)
      console.log('error')
    }
  }

  return (

    <form
      style={{
        width: '85.4vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: "rgba(0,0,0,0.618)",
        borderRadius: '16px',
        border: '1px solid #20C20E',
      }}
      onSubmit={handleSubmit(onSubmit)}>
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-end',
        }} >
      <button
        style={{
          color: 'red',
          margin: '6.18px 16.18px',
          padding: '6.18px 16.18px',
        }}
      onClick={() => handleClose()}>x</button>
      </div>
      <label htmlFor="imageUrl">Image Url</label>
      <div>
        <input style={{width:'61.8vw'}} defaultValue="" {...register("imageUrl", { required: true })} />
        {errors.imageUrl && <span>This field is required</span>}
      </div>
      <label htmlFor="content">Content</label>
      <div>
        <textarea style={{width:'61.8vw', height:'120px'}} defaultValue={
          replyIds.length > 0 ? ( replyIds.map((replyId) => {
            return `@${replyId} \n`})) : ''
          } {...register("content", { required: true  })} />
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



import { useState } from 'react'
import { useForm  } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useThread } from "@/hooks/useThread";
import { truncateEthAddress } from '@/utils'
export const CreatePost = ({threadId, replyId}: {threadId: string, replyId: string | null }) => {
  const { register, handleSubmit, formState: { errors  }  } = useForm();
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

    <form onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="imageUrl">Image Url</label>
      <div>
      <input style={{width:'60vw'}} defaultValue="" {...register("imageUrl", { required: true })} />
      {errors.imageUrl && <span>This field is required</span>}
      </div>
      <label htmlFor="content">Content</label>
      <div>
        <textarea style={{width:'60vw', height:'120px'}} defaultValue={
          replyId ? `@${replyId} ` : ''
        } {...register("content", { required: true  })} />
        {errors.content && <span>This field is required</span>}
      </div>
      <div>
        <input type="submit" />
        {rpcError && <p>{rpcError}</p>}
      </div>
    </form>
  );
}



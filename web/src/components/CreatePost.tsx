import { useForm  } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useThread } from "@/hooks/useThread";
export const CreatePost = ({threadId}: {threadId: string}) => {
  const { register, handleSubmit, formState: { errors  }  } = useForm();
  const { createPost, fetchLatestPosts } = useThread(threadId)
  const navigate = useNavigate();
  const onSubmit = async (data) => {
    console.log(data)
    const response = await createPost(
      data.imageUrl,
      data.content
    )
    console.log('response', response)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input defaultValue="" {...register("imageUrl", { required: true })} />
      {errors.imageUrl && <span>This field is required</span>}
      <textarea defaultValue="" {...register("content", { required: true  })} />
      {errors.content && <span>This field is required</span>}
      <input type="submit" />
    </form>

  );
}



import { useForm  } from "react-hook-form";
import { useNavigate } from "react-router-dom";
export const CreateThread = ({board}: {board: string}) => {
  const { register, handleSubmit, formState: { errors  }  } = useForm();
  const navigate = useNavigate();
  const onSubmit = (data) => {
    console.log(data)
    //go to /boards/:board/thread/:thread using react-router-dom
    navigate(`/boards/${board}/thread/1`)
    
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input defaultValue="subject" {...register("example")} />
      <input defaultValue="imageUrl" {...register("imageUrl", { required: true })} />
      {errors.imageUrl && <span>This field is required</span>}
      <textarea defaultValue="" {...register("content", { required: true  })} />

      {errors.content && <span>This field is required</span>}
      <input type="submit" />
    </form>

  );

}

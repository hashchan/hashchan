import { useEffect, useState } from 'react'
import { useForm  } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useCreateThread } from "@/hooks/useCreateThread";
import { useW3Storage } from '@/hooks/useW3Storage'
import MarkdownEditor from '@uiw/react-markdown-editor';
import { useParams } from "react-router-dom";
import { Modal } from '@/components/Modal'
export const CreateThread = ({
  board,
  handleClose
}: {
  board: string,
  handleClose : () => void
}) => {
  const { chainId, boardId } = useParams()
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
    } else {
      response = await createThread(
        board,
        data.title,
        '',
        data.content
      )
    }
    console.log('response', response)
    if (response.hash) {
      navigate(`/chains/${chainId}/boards/${boardId}/thread/${response.hash}`)
    } else {
      setRpcError(response.error.message)
      console.log('error')
    }
    //go to /boards/:board/thread/:thread using react-router-dom
  }

  //useEffect(() => {}, [threadId])

  return (
    <Modal handleClose={handleClose}>
      <form 
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onSubmit={handleSubmit(onSubmit)}>
        <label htmlFor="title">Title</label>
        <div style={{
          width:`${(100/Math.PHI)+(100/Math.PHI**3)}%`
          }}>
          <input style={{
            paddingLeft: 0,
            paddingRight: 0,
            margin: '4px 0',
            width:'100%'
          }}
          defaultValue="" {...register("title", { required: true })} />
          {errors.title && <span>This field is required</span>}
        </div>
        <label htmlFor="imageUrl">Image Url</label>
        <div style={{
          width:`${(100/Math.PHI)+(100/Math.PHI**3)}%`
          }}>
          {account?.model?.id && <input type="file" {...register("w3Image", { required: false })} />}
          <input style={{
            paddingLeft: 0,
            paddingRight: 0,
            margin: '4px 0',
            width:'100%'
          }}
          defaultValue="" {...register("imageUrl", { required: false })} />
        </div>
        <label htmlFor="content">Content</label>
        <div style={{width:`${(100/Math.PHI)+(100/Math.PHI**3)}%`}}>
          <MarkdownEditor
            {...register("content", { required: true  })}
            width="100%"
            height="100%"
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
            {isSubmitting ? (<span>Submitting...</span>): (<span>Make Thread</span>)}
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



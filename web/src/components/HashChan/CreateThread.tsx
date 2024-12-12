import { useEffect, useState } from 'react'
import { useForm  } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import MarkdownEditor from '@uiw/react-markdown-editor';

import { useCreateThread } from "@/hooks/HashChan/useCreateThread";
import { useW3Storage } from '@/hooks/useW3Storage'
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

  const {
    createThread,
    hash,
    logs,
    logErrors,
    threadId
  } = useCreateThread()

  const navigate = useNavigate();

  const [rpcError, setRpcError] = useState(null)

  const onSubmit = async (data) => {
    console.log(data)
    if  (data.imageUrl) {
       await createThread(
        data.title,
        data.imageUrl,
        data.content
      )
    } else if (data.w3Image) {
      const upload = await uploadFile(data.w3Image)
      console.log('upload', upload)
      await createThread(
        data.title,
        upload,
        data.content
      )
    } else {
      await createThread(
        data.title,
        '',
        data.content
      )
    }
  }

  useEffect(() => {
    if (threadId && chainId && boardId) {
      setTimeout(() => {
        handleClose()
        navigate(`/chains/${chainId}/boards/${boardId}/thread/${threadId}`)
      }, 618)
    }
  }, [chainId, boardId, threadId, navigate])

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
            type="submit"
          >
            {isSubmitting ? (<span>Submitting...</span>): (<span>Make Thread</span>)}
          </button>
          </div>
          <div>
            {hash && (
              <p className="break-words">Hash: {hash}</p>
            )}
            {logs.map((log, i) => {
              return (
              <>
                <p className="break-words" key={i}>{log.transactionHash ? 'successful' : 'failed'}</p>
              </>
              )
            })}
            {logErrors.map((log, i) => {
              return (
                <p className="break-words" key={i}>{log.toString()}</p>
              )
            })}
            { rpcError && (
              <p className="break-words">{rpcError}</p>
            )}
          </div>
      </form>
    </Modal>
  );
}



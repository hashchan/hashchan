import { useState, useEffect } from 'react'
import { useForm  } from "react-hook-form";
import { useCreatePost } from "@/hooks/HashChan/useCreatePost";
import { truncateEthAddress } from '@/utils/address'
import { parseContent } from '@/utils/content'
import MarkdownEditor from '@uiw/react-markdown-editor';
import { useW3Storage } from '@/hooks/useW3Storage'
import { Modal } from '@/components/Modal'
import {TxResponse} from '@/components/TxResponse'

export const CreatePost = ({
  replyIds,
  handleClose
}:{
  replyIds: string[],
  handleClose : () => void 
}) => {
  const {  account, uploadFile } = useW3Storage()
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting  }  } = useForm();
  const [wait, setWait] = useState(0)
  const {
    hash,
    logs,
    logErrors,
    createPost
  } =  useCreatePost()
  const onSubmit = async (data) => {
    setWait(1)
    console.log(data)
    let img = ''
    if (data.w3Image) {
      img = await uploadFile(data.w3Image)
    } else if (data.imageUrl) {
      img = data.imageUrl
    }
    const replyIds = parseContent(data.content)
    console.log('replyIds', replyIds)
    await createPost(
      img,
      data.content,
      replyIds
    )
  }

  useEffect(() => {
    if (hash?.length) {
      setWait(2)
    }
  }, [hash])

  useEffect(() => {
    if (logs.length > 0) {
      setWait(3)
    }
  }, [logs])

  return (
    <Modal name="Create Post" handleClose={handleClose}>
      <form
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onSubmit={handleSubmit(onSubmit)}
      >
        <label htmlFor="imageUrl">Image Url</label>
        {account?.model?.id && <input type="file" {...register("w3Image", { required: false })} />}
        <div style={{
          width:`${100/(Math.PHI)+(100/(Math.PHI**3))}%`
          }} 
        >
          <input style={{
              paddingLeft: 0,
              paddingRight: 0,
              margin: '4px 0',
              width: '100%',
            }}
            defaultValue="" {...register("imageUrl", { required: false })}
          />
        </div>
        <label htmlFor="content">Content</label>
        <div style={{width:`${100/(Math.PHI)+(100/(Math.PHI**3))}%`}}>
          <MarkdownEditor
            {...register("content", { required: true  })}
            style={{
              width: '100%',
              height: '100%',
            }}

            value={
              replyIds.length > 0 ? ( replyIds.map((replyId) => {
              return `[${truncateEthAddress(replyId)}](#${replyId}) \n`}).toString()) : ''
            }
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
            {isSubmitting ? (<span>Submitting...</span>): (<span>Make Post</span>)}
          </button>
        </div>
        <TxResponse
          wait={wait}
          hash={hash}
          logs={logs}
          logErrors={logErrors}
        />
      </form>
    </Modal>
  );
}

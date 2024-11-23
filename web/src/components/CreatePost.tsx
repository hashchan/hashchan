import { useState } from 'react'
import { useForm  } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useThread } from "@/hooks/useThread";
import { truncateEthAddress } from '@/utils'
import MarkdownEditor from '@uiw/react-markdown-editor';
import { useW3Storage } from '@/hooks/useW3Storage'
import { boardsMap, parseContent } from '@/utils'
export const CreatePost = ({
  threadId, replyIds, handleClose}:
    {threadId: string, replyIds: string[], handleClose : () => void }) => {
  const { board, thread } = useParams()
  const {  account, uploadFile } = useW3Storage()
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting  }  } = useForm();
  const { createPost  } = useThread(thread, board)
  const [rpcError, setRpcError] = useState(null)
  const onSubmit = async (data) => {
    console.log(data)
    let img = ''
    if (data.w3Image) {
      img = await uploadFile(data.w3Image)
    } else if (data.imageUrl) {
      img = data.imageUrl
    }
    const replyIds = parseContent(data.content)
    console.log('replyIds', replyIds)
    console.log('board', board)
    console.log('boardsMap[board]', boardsMap[board])
    const {receipt, error } = await createPost(
      boardsMap[board],
      img,
      data.content,
      replyIds
    )
    if (receipt) {
      console.log('receipt', receipt)
      handleClose()
    } else {
      setRpcError(error.message)
      console.log('error')
    }
  }

  return (

    <form
      className="flex-wrap-center overlay"
      style={{
        width: '85.4vw',
        flexDirection: 'column',
      }}
      onSubmit={handleSubmit(onSubmit)}>
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-end',
        }} >
      <button
        style={{
          color: 'red'
        }}
      onClick={() => handleClose()}>x</button>
      </div>
      <label htmlFor="imageUrl">Image Url</label>
      {account?.model?.id && <input type="file" {...register("w3Image", { required: false })} />}
      <div>
        <input style={{width:'61.8vw'}} defaultValue="" {...register("imageUrl", { required: false })} />
      </div>
      <label htmlFor="content">Content</label>
      <div>
        <MarkdownEditor
          {...register("content", { required: true  })}
          height= '23.6vh'
          width="61.8vw"
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
          type="submit">
          {isSubmitting ? (<span>Submitting...</span>): (<span>Make Post</span>)}
          </button>
          {rpcError && (<p style={{
            wordBreak: 'break-all',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word'
          }}>{rpcError}</p>)}
      </div>
    </form>
  );
}



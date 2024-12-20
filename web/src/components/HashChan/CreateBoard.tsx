import {
  Fragment,
  useState,
  useEffect
} from 'react'
import { useForm, useFieldArray  } from "react-hook-form";
import { useCreateBoard } from "@/hooks/HashChan/useCreateBoard";
import { Modal } from '@/components/Modal'
import { TxResponse } from '@/components/TxResponse'
export const CreateBoard = ({
  handleClose
}:{
  handleClose : () => void 
}) => {
  const { 
    createBoard,
    hash,
    logs,
    logErrors,
  } = useCreateBoard()
  const [wait, setWait] = useState(0)
  const {
    register,
    handleSubmit,
    control,
    formState: { 
      errors,
      isSubmitting
    }
  } = useForm({
    defaultValues: {
      name: '',
      symbol: '',
      description: '',
      bannerUrl: '',
      bannerCID: '',
      rules: [{value: ''}],
    }
  });
  const onSubmit = async (data) => {
    setWait(1)
    await createBoard(
      data.name,
      data.symbol,
      data.description,
      data.bannerUrl,
      data.rules.map(r => r.value)
    )
  }

  const {
    fields,
    append,
    remove
  } = useFieldArray({
    control,
    name: 'rules'
  })

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



  const width = `${100/(Math.PHI)+(100/(Math.PHI**3))}%`

  return (
    <Modal name="Create Board" handleClose={handleClose}>
      <form
        className="flex-wrap-center"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onSubmit={handleSubmit(onSubmit)}
      >
        <label htmlFor="name">Board Name</label>
        <div style={{width}}>
          <input 
            className="modal-form-input"
            defaultValue="" {...register("name", { required: true })} />
          {errors.name && <span>This field is required</span>}
        </div>
        <label htmlFor="content">Symbol </label>
        <div style={{width}}>
          <input
            className="modal-form-input"
            defaultValue="" {...register("symbol", { required: true })} />
          {errors.symbol && <span>This field is required</span>}
        </div>
        <label htmlFor="description">Description </label>
        <div style={{width}}>
          <input
            className="modal-form-input"
            defaultValue="" {...register("description", { required: true })} />
          {errors.symbol && <span>This field is required</span>}
        </div>
        <label htmlFor="bannerUrl">Banner Url </label>
        <div style={{width}}>
          <input
            className="modal-form-input"
            defaultValue="" {...register("bannerUrl", { required: true })} />
          {errors.symbol && <span>This field is required</span>}
        </div>
        <label htmlFor="rules">Rules</label>
        <div style={{width}}>
        {fields.map((field, i) => {
          return (
            <Fragment key={field.id}>
              <input
                className="modal-form-input"
                style={{width: '85.4%'}}
                {...register(`rules.${i}.value`)}
              />
              <button
                type="button"
                style={{
                width: '10%',
                }}
                onClick={() => remove(i)}>
                Remove
              </button>
            </Fragment>
          )
        })
        }
        </div>
        <div>
          <button
            type="button"
            onClick={() => append({ value: ''  })}
          >
            Add Rule
          </button>
          <button
            disabled={isSubmitting}
            type="submit">
            {isSubmitting ? (
              <span>Submitting...</span>
            ): (<span>Create Board</span>)
            }
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



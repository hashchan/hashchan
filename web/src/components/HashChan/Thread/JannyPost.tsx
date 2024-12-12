import { 
  useState,
} from 'react'
import { useForm } from "react-hook-form";
import { useJannyPost } from '@/hooks/ModerationService/useJannyPost'
import { truncateEthAddress } from '@/utils/address'
import { Modal } from '@/components/Modal'
import { useBoard } from '@/hooks/HashChan/useBoard'
import { GiMagicBroom } from 'react-icons/gi'
export const JannyPost = ({postId}: {postId: string}) => {
  const { board } = useBoard()
  const { jannyPost, signature, response, logErrors } = useJannyPost()
  const [isOpen, setIsOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const { register, handleSubmit, formState: { errors  }  } = useForm();

  const handleClose = () => {
    setIsOpen(old => !old)
  }

  const onSubmit = async (data) => {
    await JannyPost(
      postId,
      data.rule
    )
  }

  return (
    <>
      <span
        onClick={handleClose}
        style={{
          paddingLeft: `${1/ Math.PHI}vw`,
          color: hovered ? '#20c20E': 'white',
        }}
      >
        <GiMagicBroom />
      </span>

      {isOpen &&
        <Modal handleClose={handleClose}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex-wrap-center"
            style={{
              flexDirection: 'column',
            }}
          >
            <label htmlFor="amount">Reason: </label>
            <div style={{
              width:`${100/(Math.PHI)+(100/(Math.PHI**3))}%`,
              }}
            >
              <select
                style={{
                  width: '100%',
                  fontSize: '1rem',
                  backgroundColor: '#090909',
                  color: '#20c20e'
                }}
                {...register("rule", { required: true })}
              >
                <option value="" disabled>Select a rule</option>
                {board.rules.map((rule, i) => {
                  console.log('rule', rule)
                  return (
                    <option
                      key={i}
                      value={i}
                    >{rule}</option>
                  )
                })
              }
              </select>
              {errors.rule && <span>This field is required</span>}
            </div>
            <button type="submit">Janny Post</button>
          </form>
          {signature && <p>Transaction hash: {truncateEthAddress(signature)}</p>}
          {response && <p>Response: {response}</p>}
          {logErrors.map((error, i) => {
            return <p key={i}>{error}</p>            
          })}
        </Modal>
      }
    </>
  )
}

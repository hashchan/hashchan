import { useState } from 'react'
import { useForm } from "react-hook-form"
import { useJannyPost } from '@/hooks/ModerationService/useJannyPost'
import { useModerationServices } from '@/hooks/ModerationService/useModerationServices'
import { truncateEthAddress } from '@/utils/address'
import { Modal } from '@/components/Modal'
import { useBoard } from '@/hooks/HashChan/useBoard'
import { GiMagicBroom } from 'react-icons/gi'
import { useParams } from 'react-router-dom'

interface JannyPostFormData {
  moderationService: number
  rule: number
}
interface JannyPostProps {
    postId: string | undefined // Make it clear that it might be undefined
    
}
export const JannyPost = ({ postId = '' }: JannyPostProps) => {
  const { board } = useBoard()
  const { chainId } = useParams()
  const { 
    jannyPost, 
    isLoading, 
    error, 
    signature, 
    response,
    reset 
  } = useJannyPost()

  const { moderationServices } = useModerationServices({
    filter: {
      where: {
        subscribed: 1,
        chainId: Number(chainId)
      }
    }
  })

  const [isOpen, setIsOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<JannyPostFormData>()

  const handleClose = () => {
    setIsOpen(prev => !prev)
    if (error || signature) {
      reset()
    }
  }

  const onSubmit = async (data: JannyPostFormData) => {
    const selectedService = moderationServices[data.moderationService]
    await jannyPost({
      moderationService: selectedService,
      postId: postId as `0x${string}`,
      ruleIndex: data.rule
    })
  }

  return (
    <>
      <span
        onClick={handleClose}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          paddingLeft: `${1 / Math.PHI}vw`,
          color: hovered ? '#20c20E' : 'white',
          cursor: 'pointer'
        }}
      >
        <GiMagicBroom />
      </span>

      {isOpen && (
        <Modal name="Janitor Post" handleClose={handleClose}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex-wrap-center"
            style={{
              flexDirection: 'column',
            }}
          >
            <label htmlFor="moderationService">Moderation Service</label>
            <div style={{ width: `${100 / (Math.PHI) + (100 / (Math.PHI ** 3))}%` }}>
              <select
                style={{
                  width: '100%',
                  fontSize: '1rem',
                  backgroundColor: '#090909',
                  color: '#20c20e'
                }}
                {...register("moderationService", { required: "Please select a moderation service" })}
              >
                <option value="" disabled>Select a service</option>
                {moderationServices.map((modService, i) => (
                  <option key={modService.address} value={i}>
                    {modService.name}
                  </option>
                ))}
              </select>
              {errors.moderationService && (
                <span style={{ color: 'red' }}>{errors.moderationService.message}</span>
              )}
            </div>

            <label htmlFor="rule">Reason</label>
            <div style={{ width: `${100 / (Math.PHI) + (100 / (Math.PHI ** 3))}%` }}>
              <select
                style={{
                  width: '100%',
                  fontSize: '1rem',
                  backgroundColor: '#090909',
                  color: '#20c20e'
                }}
                {...register("rule", { required: "Please select a rule" })}
              >
                <option value="" disabled>Select a rule</option>
                {board?.rules.map((rule, i) => (
                  <option key={i} value={i}>
                    {rule}
                  </option>
                ))}
              </select>
              {errors.rule && (
                <span style={{ color: 'red' }}>{errors.rule.message}</span>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              style={{ opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? 'Submitting...' : 'Janny Post'}
            </button>
          </form>

          {error && (
            <p style={{ color: 'red' }}>Error: {error.message}</p>
          )}

          {signature && (
            <p>Signature: {truncateEthAddress(signature)}</p>
          )}

          {response && (
            <p>Response: {JSON.stringify(response)}</p>
          )}
        </Modal>
      )}
    </>
  )
}

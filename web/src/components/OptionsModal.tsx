import { useState, useEffect } from 'react'
import { Modal } from '@/components/Modal'
import { FaGear } from 'react-icons/fa6'
import { useForm } from 'react-hook-form'
import { useSettings, useHookSettings } from '@hashchan/hooks'
import { formatEther, parseEther } from 'viem'

const OptionsModalContent = ({ handleClose }: { handleClose: () => void }) => {
  const { settings, updateSettings } = useSettings()
  const { hookSettings, updateHookSettings } = useHookSettings()
  const [showSuccess, setShowSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      defaultTipAmount: '',
      indexingStrategy: 'fullNode' as 'fullNode' | 'reverseChunked' | 'bulkScrape',
      blockRangeLimit: 10000,
    },
  })

  const indexingStrategy = watch('indexingStrategy')

  useEffect(() => {
    if (settings && hookSettings) {
      reset({
        defaultTipAmount: formatEther(BigInt(settings.defaultTipAmount)),
        indexingStrategy: hookSettings.indexingStrategy,
        blockRangeLimit: hookSettings.blockRangeLimit,
      })
    }
  }, [settings, hookSettings, reset])

  const onSubmit = async (data: any) => {
    await updateSettings({
      defaultTipAmount: parseEther(data.defaultTipAmount).toString(),
    })
    await updateHookSettings({
      indexingStrategy: data.indexingStrategy,
      blockRangeLimit: Number(data.blockRangeLimit),
    })
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2618)
  }

  const width = `${100 / Math.PHI + 100 / Math.PHI ** 3}%`

  return (
    <Modal name="Options" handleClose={handleClose}>
      <form
        className="flex-wrap-center"
        style={{ flexDirection: 'column' }}
        onSubmit={handleSubmit(onSubmit)}
      >
        <label htmlFor="defaultTipAmount">Default Tip Amount</label>
        <div style={{ width }}>
          <input
            className="modal-form-input"
            {...register('defaultTipAmount', { required: false })}
          />
          {errors.defaultTipAmount && <span>This field is required</span>}
        </div>

        <label htmlFor="indexingStrategy" style={{ marginTop: '1rem' }}>Index Strategy</label>
        <div style={{ width }}>
          <div className="radio-group">
            <div className="radio-option">
              <input type="radio" id="fullNode" value="fullNode" {...register('indexingStrategy')} />
              <label htmlFor="fullNode">Full Node</label>
              <p style={{ fontSize: '13px' }}>Good for full powered RPCs. Fetches all history from the start of the contract.</p>
            </div>
            <div className="radio-option">
              <input type="radio" id="reverseChunked" value="reverseChunked" {...register('indexingStrategy')} />
              <label htmlFor="reverseChunked">Reverse Chunked</label>
              <p style={{ fontSize: '13px' }}>Good for limited RPCs. Fetches in small batches backwards from the current block.</p>
            </div>
            <div className="radio-option">
              <input type="radio" id="bulkScrape" value="bulkScrape" {...register('indexingStrategy')} />
              <label htmlFor="bulkScrape">Bulk Scrape</label>
              <p style={{ fontSize: '13px' }}>Good for strange RPCs. Fetches everything unfiltered from genesis — may be slow.</p>
            </div>
          </div>
        </div>

        {indexingStrategy === 'reverseChunked' && (
          <>
            <label htmlFor="blockRangeLimit" style={{ marginTop: '1rem' }}>
              Block Range Limit
            </label>
            <div style={{ width }}>
              <input
                className="modal-form-input"
                type="number"
                min={1}
                max={Infinity}
                {...register('blockRangeLimit', { required: true, min: 1, valueAsNumber: true })}
              />
              <p style={{ fontSize: '13px', marginTop: '5px' }}>
                Lower this if your RPC rejects large log ranges. Raise it if fetches are slow. Default: 16180.
              </p>
              {errors.blockRangeLimit && <span>Must be at least 1</span>}
            </div>
          </>
        )}

        <button disabled={isSubmitting} type="submit" style={{ marginTop: '1rem' }}>
          {isSubmitting ? <span>Saving...</span> : <span>Save</span>}
        </button>

        {showSuccess && (
          <div className="flex-wrap-center" style={{ flexDirection: 'row', width: '100%' }}>
            <p style={{ color: '#20C20E' }}>Options saved successfully</p>
          </div>
        )}
      </form>
    </Modal>
  )
}

export const OptionsModal = ({ pxSize }: { pxSize: string }) => {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button className="flex-wrap-center" onClick={() => setShowModal(v => !v)}>
        {'​'}<FaGear />
      </button>
      {showModal && <OptionsModalContent handleClose={() => setShowModal(false)} />}
    </>
  )
}

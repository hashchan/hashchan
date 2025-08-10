import { useState, useEffect } from 'react'
import { Modal } from '@/components/Modal'
import { FaGear } from 'react-icons/fa6'
import { useForm } from 'react-hook-form'
import { useOptions } from '@/hooks/useOptions'
const OptionsModalContent = ({ handleClose }: { handleClose: () => void }) => {

  const { options, updateOptions} = useOptions()


  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting } } = useForm({
      defaultValues: {
        defaultTipAmount: '',
        indexingStrategy: 'fullNode',
      },
    });

  // Convert wei to ETH for display
  const weiToEth = (weiString: string): string => {
    const wei = BigInt(weiString);
    const eth = wei.toString();
    
    // If less than 18 digits, pad with leading zeros
    const paddedWei = eth.padStart(18, '0');
    
    // Insert decimal point 18 places from the right
    const integerPart = paddedWei.slice(0, -18) || '0';
    const decimalPart = paddedWei.slice(-18);
    
    // Remove trailing zeros from decimal part
    const trimmedDecimal = decimalPart.replace(/0+$/, '');
    
    return trimmedDecimal ? `${integerPart}.${trimmedDecimal}` : integerPart;
  };

  // Convert ETH to wei for storage
  const ethToWei = (ethString: string): string => {
    const [integerPart = '0', decimalPart = ''] = ethString.split('.');
    const paddedDecimal = decimalPart.padEnd(18, '0').slice(0, 18);
    return (BigInt(integerPart) * 10n**18n + BigInt(paddedDecimal)).toString();
  };

  // Reset form with async data when options are loaded
  useEffect(() => {
    if (options) {
      const ethValue = weiToEth(options.defaultTipAmount);
      console.log('Wei:', options.defaultTipAmount);
      console.log('ETH:', ethValue);
      
      reset({
        defaultTipAmount: ethValue,
        indexingStrategy: options.indexingStrategy,
      });
    }
  }, [options, reset]);

  const onSubmit = async (data) => {
    // Convert ETH back to wei for storage
    const weiValue = ethToWei(data.defaultTipAmount);
    await updateOptions(weiValue, data.indexingStrategy);
  }

  const width = `${100 / (Math.PHI) + (100 / (Math.PHI ** 3))}%`

  return (
    <Modal name="Options" handleClose={handleClose}>
      <form
        className='flex-wrap-center'
        style={{
          flexDirection: 'column',
        }}
        onSubmit={handleSubmit(onSubmit)}
      >
        <label htmlFor="defaultTipAmount">Default Tip Amount</label>
        <div style={{ width }}>
          <input
            className="modal-form-input"
            defaultValue="" {...register("defaultTipAmount", { required: false })} />
          {errors.defaultTipAmount
            && <span>This field is required</span>
          }
        </div>
        <label htmlFor="indexingStrategy">Index Strategy</label>
        <div style={{ width }}>
          <div className="radio-group">
            <div className="radio-option">
              <input
                type="radio"
                id="fullNode"
                value="fullNode"
                {...register("indexingStrategy", { required: false })}
              />
              <label htmlFor="fullNode">Full Node</label>
              <p style={{fontSize:'13px'}}>Good for full powered RPCs. Will fetch on demand from beginning of contract history.</p>
            </div>
            <div className="radio-option">
              <input
                type="radio"
                id="reverseChunked"
                value="reverseChunked"
                {...register("indexingStrategy", { required: false })}
              />
              <label htmlFor="reverseChunked">Reverse Chunked</label>
              <p style={{fontSize:'13px'}}>Good for limited RPCs, will fetch on demand in small batches in reverse from the current date.</p>
            </div>
            <div className="radio-option">
              <input
                type="radio"
                id="bulkScrape"
                value="bulkScrape"
                {...register("indexingStrategy", { required: false })}
              />
              <label htmlFor="bulkScrape">Bulk Scrape</label>
              <p style={{fontSize:'13px'}}>Good for strange RPCs, will fetch everything without filters from the beginning, may take awhile.</p>
            </div>
          </div>
          {errors.indexingStrategy
            && <span>This field is required</span>
          }
        </div>

        <button
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <span>Submitting...</span>
          ) : (
            <span>Submit</span>
          )}
        </button>

      </form>

    </Modal>
  )
}

export const OptionsModal = ({ pxSize }: { pxSize: string }) => {
  const [showModal, setShowModal] = useState(false)

  const handleShowModal = () => {
    setShowModal(!showModal)
  }

  return (
    <>
      <button onClick={handleShowModal}>
        <FaGear size={pxSize} />
      </button>
      {showModal && <OptionsModalContent handleClose={handleShowModal} />}
    </>
  )
}

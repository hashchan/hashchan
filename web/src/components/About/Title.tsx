import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'


const Cryptographic = ({isMobile}: {isMobile: boolean}) => {
  const startChars = ['1', '9', 'e', '3', '7','7', '9', 'b']
  const endChars = ['h', 'a', 's', 'h', 'c', 'h', 'a', 'n']
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTransitioning(true)
    }, 1618)

    return () => clearTimeout(timer)
  }, [])

    return (
      <div
        style={{
          marginTop: '40vh',
        }}
      >
        { startChars.map((char,i) => (
          <AnimatePresence mode="wait" key={i}>
            <motion.span
              key={isTransitioning ? `end-${i}` : `start-${i}`}
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{
                duration: 1/Math.PHI**4,
                exit: { duration: 1/Math.PHI**4 },
                delay: i/Math.PHI**4,
                ease: "easeInOut",
              }}
            > {
                isMobile ? (
                  <motion.h2
                    initial={{color: '#20c20E'}}
                    animate={{color: '#19e377'}}
                    transition={{
                      delay: 2.618,
                    }}
                    style={{display: 'inline'}}>
                      <i>{isTransitioning ? endChars[i] : char}</i>
                    </motion.h2>)
                  : (
                  <motion.h1
                    initial={{color: '#20c20E'}}
                    animate={{color: '#19e377'}}
                    transition={{
                      delay: 2.618,
                    }}
                    style={{display: 'inline'}}>
                      <i>{isTransitioning ? endChars[i] : char}</i>
                  </motion.h1>
                )
              }
            </motion.span>
          </AnimatePresence>
        ))

        }
      </div>
    )
}


const Laser = ({isMobile}: {isMobile: boolean}) => {
  return (
      <motion.div
        style={{
        width: isMobile ? '14.5vw' : '358px',
        }}
        initial={{x: "-10vw"}}
        animate={{x: ["-10vw", isMobile ? '12.5vw': '42.5vw']}}
        transition={{
          duration: 0.382,
          ease: "linear",
        }}
      >
        <Cryptographic isMobile={isMobile} />
        <motion.div
          style={{
          position: 'absolute',
          left: isMobile ? 'calc(-20vw)': 'calc(-50vw)',
          width: '61.8vw',
          boxShadow: '0 0 15px 5px #20c20E',
          borderBottom: '1px solid #20c20E'
          }}>
        {
          isMobile ? (
            <motion.span
              style={{
              position: 'absolute',
              fontSize: '13px',
              top: '-10px',
              right: '-1vw'
              }}
            >
              0x
            </motion.span>) : (
            <motion.span
              style={{
              position: 'absolute',
              fontSize: '13px',
              top: '-10px',
              right: '-1vw'
              }}
            >
              0x
            </motion.span>

          )
        }
        </motion.div>
      </motion.div>
  )
}
export const Title = ({isMobile}:{isMobile: boolean}) => {

  return (
    <Laser isMobile={isMobile} />
  )
}

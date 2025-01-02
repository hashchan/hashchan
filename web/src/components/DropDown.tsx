import {
  ReactNode,
  useEffect,
  useState,
  useCallback,
	useRef
} from 'react'

export const DropDown = ({
  name,
  children
}:{
  name: string | ReactNode
  children:ReactNode
}) => {
  const [expand, setExpand] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current && 
      buttonRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      !buttonRef.current.contains(event.target as Node)
    ) {
      setExpand(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleClickOutside])

  return (
    <div style={{position: 'relative', display: 'inline-flex'}}>
    <button
			ref={buttonRef}
      style={{
        margin: '0 1.25vw',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
      }}
      onClick={() => setExpand(old => !old)}
    >
      <p>{expand ? "▾" : "▸"}&nbsp;</p>
      {name}
    </button>
    <div
      ref={dropdownRef}
      style={{
        backgroundColor: '#090909',
        position: 'absolute',
        top: '100%',
        zIndex: '1',
        width: `${100*Math.PHI}px`,
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
      }}>
        {expand && children}
      </div>
    </div>
    </div>
  )
}

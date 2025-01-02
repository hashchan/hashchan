import { ReactNode, useState, useRef, useEffect, useCallback } from 'react';
import Draggable from 'react-draggable';
import { BrowserView, MobileView } from 'react-device-detect';

interface ModalProps {
  name: string;
  handleClose: () => void;
  children: ReactNode;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
}

export const Modal = ({
  name,
  handleClose,
  children,
  initialWidth = 618,
  initialHeight = 618,
  minWidth = 261,
  minHeight = 161,
}: ModalProps) => {
  const [dimensions, setDimensions] = useState({
    width: initialWidth,
    height: initialHeight,
  });
  const [isResizing, setIsResizing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startDimensions = useRef({ width: 0, height: 0 });

  // Convert between viewport width and pixels
  const vwToPx = (vw: number) => (window.innerWidth * vw) / 100;
  const pxToVw = (px: number) => (px * 100) / window.innerWidth;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;

      const newWidth = Math.max(startDimensions.current.width + deltaX, minWidth);
      const newHeight = Math.max(startDimensions.current.height + deltaY, minHeight);

      // Ensure width doesn't exceed viewport
      const maxWidth = window.innerWidth * 0.95; // 95% of viewport
      const clampedWidth = Math.min(newWidth, maxWidth);

      setDimensions({ 
        width: clampedWidth,
        height: newHeight 
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, minHeight]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    startDimensions.current = dimensions;
  };

  // Calculate width in viewport units for display
  const widthInVw = pxToVw(dimensions.width);

  const mobileRef= useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      mobileRef.current &&
      !mobileRef.current.contains(event.target as Node)
    ) {
      handleClose();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleClickOutside])
  return (
    <>
      <BrowserView>
        <Draggable handle=".modal-header">
          <div
            ref={modalRef}
            className="modal-container"
            style={{
              position: 'fixed',
              backgroundColor: '#090909',
              border: '1px solid #20C20E20',
              padding: `${1/Math.PHI**2}rem`,
              width: `${widthInVw}vw`,
              height: dimensions.height,
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1618,
              top: `${100/(Math.PHI**3)}%`,
              left: `${100/(Math.PHI**3)}%`,
            }}
          >
            <div
              className="modal-header"
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'move',
                paddingBottom: `${1/(Math.PHI**2)}rem`,
                background: '#20C20E20',
                margin: `-${1/(Math.PHI**2)}rem -${1/(Math.PHI**2)}rem ${1/(Math.PHI)}rem -${1/(Math.PHI**2)}rem`,
                padding: `${1/(Math.PHI**9)}rem ${1/(Math.PHI**2)}rem`,
                borderBottom: '1px solid #20C20E20',
              }}
            >
              <p style={{
                flexGrow: 1,
                textAlign: 'center',
                marginLeft: '34px',
                paddingLeft: `${(1/(Math.PHI**2))}rem`,
              }}>{name}</p>
              <button
                style={{
                  width: '34px',
                  color: '#ff0000',
                  background: 'none',
                  border: 'none',
                  fontSize: `${(Math.PHI)}rem`,
                  cursor: 'pointer',
                }}
                onClick={handleClose}
              >
                ×
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflow: 'auto',
              }}
            >
              {children}
            </div>

            <div
              className="resize-handle"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '15px',
                height: '15px',
                cursor: 'se-resize',
                background: 'linear-gradient(135deg, transparent 50%, #20C20E 50%)',
              }}
              onMouseDown={handleResizeStart}
            />
          </div>
        </Draggable>
      </BrowserView>
      <MobileView>
        <div
          ref={mobileRef}
          style={{
            position: 'absolute',
            top: '50%',
            left:'50%',
            transform: 'translate(-50%, -50%)',
            width: `${100/Math.PHI + 100/Math.PHI**3 + 100/Math.PHI**5}vw`,
            backgroundColor: '#090909',
            zIndex: 1618,
          }}
        >
          <p style={{
          textAlign: 'center',
          width: '100%',
          paddingBottom: `${1/(Math.PHI**2)}rem`,
          background: '#20C20E20',
          margin: `-${1/(Math.PHI**2)}rem -${1/(Math.PHI**2)}rem ${1/(Math.PHI)}rem -${1/(Math.PHI**2)}rem`,
          padding: `${1/(Math.PHI**9)}rem ${1/(Math.PHI**2)}rem`,
          borderBottom: '1px solid #20C20E20',

          }}>{name}</p>
          {children}
        </div>
      </MobileView>
    </>
  );
}

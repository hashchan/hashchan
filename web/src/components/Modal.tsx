import { ReactNode, useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';

interface ModalProps {
  handleClose: () => void;
  children: ReactNode;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
}

export const Modal = ({
  handleClose,
  children,
  initialWidth = 618,
  initialHeight = 618,
  minWidth = 200,
  minHeight = 150,
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

  return (
    <Draggable handle=".modal-header">
      <div
        ref={modalRef}
        className="modal-container"
        style={{
          position: 'fixed',
          backgroundColor: '#000',
          border: '1px solid #20C20E',
          borderRadius: '4px',
          padding: '1rem',
          width: `${widthInVw}vw`,
          height: dimensions.height,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
        }}
      >
        <div
          className="modal-header"
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
            cursor: 'move',
            paddingBottom: '0.5rem',
            background: 'rgba(32, 194, 14, 0.1)',
            margin: '-1rem -1rem 0.5rem -1rem',
            padding: '0.5rem 1rem',
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px',
            borderBottom: '1px solid rgba(32, 194, 14, 0.2)',
          }}
        >
          <button
            style={{
              color: '#ff0000',
              background: 'none',
              border: 'none',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '0.2rem 0.5rem',
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
  );
};

import { useEffect, useState, useRef, useCallback, type ReactNode } from 'react'

export interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  className = '',
}: BottomSheetProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const currentTranslateY = useRef(0)
  const isDragging = useRef(false)

  // Open/close animation
  useEffect(() => {
    if (open) {
      setIsVisible(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimating(true))
      })
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else {
      setIsAnimating(false)
      const timer = setTimeout(() => {
        setIsVisible(false)
        document.body.style.overflow = ''
      }, 300)
      return () => clearTimeout(timer)
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Drag to dismiss
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY
    currentTranslateY.current = 0
    isDragging.current = true
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return
    const deltaY = e.touches[0].clientY - dragStartY.current
    if (deltaY > 0) {
      currentTranslateY.current = deltaY
      sheetRef.current.style.transform = `translateY(${deltaY}px)`
      sheetRef.current.style.transition = 'none'
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false
    if (!sheetRef.current) return

    sheetRef.current.style.transition = ''
    if (currentTranslateY.current > 100) {
      onClose()
    } else {
      sheetRef.current.style.transform = ''
    }
    currentTranslateY.current = 0
  }, [onClose])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className={`
          absolute inset-0 bg-black/40
          transition-opacity duration-300
          ${isAnimating ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`
          absolute bottom-0 left-0 right-0
          bg-bg-card rounded-t-[20px]
          shadow-xl
          transition-transform duration-300 ease-out
          ${isAnimating ? 'translate-y-0' : 'translate-y-full'}
          max-h-[85vh] flex flex-col
          safe-area-inset-bottom
          ${className}
        `}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-[5px] rounded-full bg-bg-inset" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-5 pb-3 pt-1">
            <h3 className="text-[17px] font-bold text-text text-center">
              {title}
            </h3>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-3">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 pb-5 pt-3 border-t border-border-light">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/*
 * Usage:
 *
 * const [open, setOpen] = useState(false)
 *
 * <BottomSheet
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   title="Choisir un type"
 *   footer={
 *     <button className="w-full bg-primary text-white rounded-xl py-3.5 font-semibold">
 *       Confirmer
 *     </button>
 *   }
 * >
 *   <div className="space-y-3">
 *     <p>Contenu du bottom sheet</p>
 *   </div>
 * </BottomSheet>
 */

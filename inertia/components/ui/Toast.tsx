import { useEffect, useState } from 'react'
import { X, Check, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  onClose?: () => void
}

export function Toast({ message, type = 'success', duration = 3500, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true)
      setTimeout(() => { setIsVisible(false); onClose?.() }, 200)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => { setIsVisible(false); onClose?.() }, 200)
  }

  if (!isVisible) return null

  const config = {
    success: { icon: <Check className="w-4 h-4" />, bg: 'bg-text text-white' },
    error: { icon: <AlertCircle className="w-4 h-4" />, bg: 'bg-error text-white' },
    warning: { icon: <AlertTriangle className="w-4 h-4" />, bg: 'bg-warning text-white' },
    info: { icon: <Info className="w-4 h-4" />, bg: 'bg-text text-white' },
  }

  const { icon, bg } = config[type]

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-[100]
        max-w-sm w-[calc(100%-2rem)]
        ${bg} rounded-xl shadow-lg
        flex items-center gap-2.5 px-4 py-3
        transition-all duration-200
        ${isLeaving ? 'opacity-0 -translate-y-2 scale-95' : 'opacity-100 translate-y-0 scale-100'}
        animate-slide-down
      `}
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))' }}
      role="alert"
    >
      {icon}
      <p className="flex-1 text-[13px] font-medium">{message}</p>
      <button onClick={handleClose} className="p-1 opacity-60 hover:opacity-100" aria-label="Fermer">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

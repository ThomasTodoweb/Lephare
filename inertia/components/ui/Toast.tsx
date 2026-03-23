import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  onClose?: () => void
}

export function Toast({ message, type = 'success', duration = 4000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true)
      setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, 250)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 250)
  }

  if (!isVisible) return null

  const config = {
    success: {
      icon: <CheckCircle className="w-5 h-5 text-success" />,
      bg: 'bg-success-light border-success/20',
      text: 'text-green-800',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-error" />,
      bg: 'bg-error-light border-error/20',
      text: 'text-red-800',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-warning" />,
      bg: 'bg-warning-light border-warning/20',
      text: 'text-orange-800',
    },
    info: {
      icon: <Info className="w-5 h-5 text-info" />,
      bg: 'bg-info-light border-info/20',
      text: 'text-blue-800',
    },
  }

  const { icon, bg, text } = config[type]

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-[100]
        max-w-sm w-[calc(100%-2rem)] mx-auto
        ${bg} border rounded-[var(--radius-md)] shadow-md
        flex items-center gap-3 px-4 py-3
        transition-all duration-[var(--duration-normal)]
        ${isLeaving ? 'opacity-0 -translate-y-2 scale-95' : 'opacity-100 translate-y-0 scale-100'}
        animate-fade-up
      `}
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))'
      }}
      role="alert"
    >
      {icon}
      <p className={`flex-1 text-sm font-medium ${text}`}>{message}</p>
      <button
        onClick={handleClose}
        className="p-1 hover:bg-black/5 rounded-full transition-colors"
        aria-label="Fermer"
      >
        <X className="w-4 h-4 text-neutral-400" />
      </button>
    </div>
  )
}

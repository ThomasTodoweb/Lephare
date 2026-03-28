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
    success: { icon: <Check className="w-4 h-4" />, bg: 'bg-success text-white', glow: 'shadow-glow-success' },
    error: { icon: <AlertCircle className="w-4 h-4" />, bg: 'bg-error text-white', glow: '' },
    warning: { icon: <AlertTriangle className="w-4 h-4" />, bg: 'bg-warning text-bg', glow: '' },
    info: { icon: <Info className="w-4 h-4" />, bg: 'bg-bg-elevated text-text border border-border', glow: '' },
  }

  const { icon, bg, glow } = config[type]

  return (
    <div
      className={`
        fixed left-1/2 -translate-x-1/2 z-[100]
        w-auto max-w-[calc(100%-3rem)]
        ${bg} rounded-full ${glow}
        flex items-center gap-2.5 px-4 py-2.5
        backdrop-blur-xl
        transition-all duration-200
        ${isLeaving ? 'opacity-0 -translate-y-2 scale-95' : 'opacity-100 translate-y-0 scale-100'}
        animate-slide-down
      `}
      style={{ top: 'calc(env(safe-area-inset-top, 12px) + 12px)' }}
      role="alert"
    >
      {icon}
      <p className="text-[13px] font-semibold whitespace-nowrap">{message}</p>
      <button onClick={handleClose} className="p-0.5 opacity-60 hover:opacity-100 ml-1 tap-target" aria-label="Fermer">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

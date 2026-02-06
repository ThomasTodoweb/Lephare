import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
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
      }, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300)
  }

  if (!isVisible) return null

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  }

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
  }

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-[100]
        max-w-sm w-[calc(100%-2rem)] mx-auto
        ${bgColors[type]} border rounded-xl shadow-lg
        flex items-center gap-3 px-4 py-3
        transition-all duration-300 ease-out
        ${isLeaving ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}
        animate-slide-down
      `}
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))'
      }}
    >
      {icons[type]}
      <p className={`flex-1 text-sm font-medium ${textColors[type]}`}>{message}</p>
      <button
        onClick={handleClose}
        className="p-1 hover:bg-black/5 rounded-full transition-colors"
      >
        <X className="w-4 h-4 text-neutral-400" />
      </button>
    </div>
  )
}

// Container for multiple toasts
export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
      <div className="pointer-events-auto">{children}</div>
    </div>
  )
}

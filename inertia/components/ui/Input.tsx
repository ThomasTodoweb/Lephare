import { type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
  hint?: string
}

export function Input({
  error,
  label,
  hint,
  className = '',
  id,
  ...props
}: InputProps) {
  const baseClasses = 'w-full px-4 py-3 bg-surface border-2 border-neutral-200 rounded-[var(--radius-md)] text-text placeholder-text-muted transition-colors duration-[var(--duration-fast)]'
  const focusClasses = 'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10'
  const errorClasses = error ? 'border-error focus:border-error focus:ring-error/10' : ''
  const disabledClasses = 'disabled:bg-neutral disabled:border-neutral-200 disabled:text-text-muted'

  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block mb-2 text-sm font-medium text-text">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`${baseClasses} ${focusClasses} ${errorClasses} ${disabledClasses} ${className}`}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-text-muted">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-error font-medium">{error}</p>}
    </div>
  )
}

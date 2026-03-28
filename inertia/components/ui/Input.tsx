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
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block mb-1.5 text-[13px] font-semibold text-text-secondary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full h-12 px-4 bg-bg-elevated border border-border rounded-xl
          text-[15px] text-text placeholder-text-muted
          transition-all duration-[var(--duration-fast)]
          focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10
          disabled:opacity-50 disabled:bg-bg-inset
          ${error ? 'border-error focus:border-error focus:ring-error/10' : ''}
          ${className}
        `}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-[12px] text-text-muted">{hint}</p>}
      {error && <p className="mt-1.5 text-[12px] text-error font-medium">{error}</p>}
    </div>
  )
}

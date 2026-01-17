import { type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

export function Input({
  error,
  label,
  className = '',
  id,
  ...props
}: InputProps) {
  const baseClasses = 'w-full px-4 py-3 bg-white border-2 border-primary rounded-xl text-text placeholder-gray-400'
  const focusClasses = 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
  const errorClasses = error ? 'border-red-600' : ''
  const disabledClasses = 'disabled:bg-neutral disabled:border-gray-300 disabled:text-gray-500'

  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block mb-2 font-medium text-text">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`${baseClasses} ${focusClasses} ${errorClasses} ${disabledClasses} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

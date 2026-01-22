import { type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outlined'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  variant = 'filled',
  size = 'md',
  disabled = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-colors'

  const variantClasses = {
    filled: 'bg-primary text-white hover:bg-primary-dark disabled:bg-primary/50',
    outlined: 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:border-neutral-200 disabled:text-neutral-300',
  }

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm min-h-[44px]',
    md: 'px-6 py-3 text-base min-h-[44px]',
    lg: 'px-8 py-4 text-lg min-h-[48px]',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

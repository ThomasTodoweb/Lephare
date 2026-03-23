import { type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outlined' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
}

export function Button({
  variant = 'filled',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius-sm)] transition-all duration-[var(--duration-fast)] active:scale-[0.97]'

  const variantClasses = {
    filled: 'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md disabled:bg-primary/40 disabled:shadow-none',
    outlined: 'bg-white border-2 border-neutral-200 text-text hover:border-neutral-300 hover:bg-neutral-50 disabled:border-neutral-100 disabled:text-text-muted',
    ghost: 'bg-transparent text-text-secondary hover:bg-neutral-100 disabled:text-text-muted',
    danger: 'bg-error text-white hover:bg-red-700 shadow-sm disabled:bg-error/40',
  }

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-[15px] min-h-[48px]',
    lg: 'px-8 py-4 text-base min-h-[52px]',
  }

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <Loader2 size={iconSize} className="animate-spin" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon size={iconSize} />
      ) : null}
      {children}
      {!loading && Icon && iconPosition === 'right' ? (
        <Icon size={iconSize} />
      ) : null}
    </button>
  )
}

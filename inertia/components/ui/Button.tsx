import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  children,
  ...props
}, ref) {
  const isDisabled = disabled || loading

  const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-all active:scale-[0.97]'

  const variants = {
    primary: 'bg-text text-white hover:opacity-90 disabled:opacity-40',
    secondary: 'bg-bg-subtle text-text border border-border hover:bg-bg-inset disabled:opacity-40',
    ghost: 'bg-transparent text-text-secondary hover:bg-bg-subtle disabled:opacity-40',
    danger: 'bg-error text-white hover:opacity-90 disabled:opacity-40',
  }

  const sizes = {
    sm: 'h-9 px-3.5 text-[13px] rounded-lg',
    md: 'h-11 px-5 text-[15px] rounded-xl',
    lg: 'h-[52px] px-6 text-base rounded-xl',
  }

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16

  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
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
})

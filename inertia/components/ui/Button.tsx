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

  const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-[var(--duration-normal)] active:scale-[0.97] tap-target relative overflow-hidden'

  const variants = {
    primary: 'bg-primary text-white hover:brightness-110 disabled:opacity-40 shadow-md hover:shadow-glow-primary',
    secondary: 'bg-bg-elevated text-text border border-border hover:bg-bg-subtle hover:border-border-light disabled:opacity-40',
    ghost: 'bg-transparent text-text-secondary hover:bg-bg-elevated hover:text-text disabled:opacity-40',
    danger: 'bg-error text-white hover:brightness-110 disabled:opacity-40 shadow-md',
  }

  const sizes = {
    sm: 'h-9 px-3.5 text-[13px] rounded-lg',
    md: 'h-11 px-5 text-[15px] rounded-xl',
    lg: 'h-[52px] px-6 text-base rounded-2xl font-bold',
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

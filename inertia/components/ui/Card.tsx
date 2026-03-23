import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'ghost'
}

export function Card({
  variant = 'default',
  className = '',
  children,
  ...props
}: CardProps) {
  const baseClasses = 'rounded-[var(--radius-lg)] p-5'

  const variantClasses = {
    default: 'bg-surface shadow-xs',
    bordered: 'bg-surface border-2 border-primary shadow-xs',
    elevated: 'bg-surface-elevated shadow-md',
    ghost: 'bg-transparent',
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

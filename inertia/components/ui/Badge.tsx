import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'streak' | 'xp'
  size?: 'sm' | 'md'
  children: ReactNode
  className?: string
}

export function Badge({
  variant = 'default',
  size = 'sm',
  children,
  className = '',
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center gap-1 font-semibold rounded-full whitespace-nowrap'

  const variantClasses = {
    default: 'bg-neutral text-text-secondary',
    primary: 'bg-primary-50 text-primary',
    success: 'bg-success-light text-green-700',
    warning: 'bg-warning-light text-orange-700',
    error: 'bg-error-light text-red-700',
    streak: 'bg-orange-50 text-streak',
    xp: 'bg-amber-50 text-amber-700',
  }

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  )
}

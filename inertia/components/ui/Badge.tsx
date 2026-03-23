import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'streak'
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const base = 'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md'

  const variants = {
    default: 'bg-bg-subtle text-text-secondary',
    primary: 'bg-primary-50 text-primary',
    success: 'bg-success-light text-green-700',
    warning: 'bg-warning-light text-amber-700',
    error: 'bg-error-light text-red-700',
    streak: 'bg-orange-50 text-orange-600',
  }

  return <span className={`${base} ${variants[variant]} ${className}`}>{children}</span>
}

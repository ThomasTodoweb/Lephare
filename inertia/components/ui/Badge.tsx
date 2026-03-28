import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'streak'
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const base = 'inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wide uppercase'

  const variants = {
    default: 'bg-bg-elevated text-text-secondary border border-border',
    primary: 'bg-primary-50 text-primary border border-primary/10',
    success: 'bg-success-light text-success border border-success/10',
    warning: 'bg-warning-light text-warning border border-warning/10',
    error: 'bg-error-light text-error border border-error/10',
    streak: 'bg-gradient-to-r from-orange-500/15 to-yellow-500/15 text-streak border border-streak/10',
  }

  return <span className={`${base} ${variants[variant]} ${className}`}>{children}</span>
}

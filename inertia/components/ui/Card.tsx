import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'flat' | 'interactive'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  ...props
}: CardProps) {
  const base = 'rounded-2xl'

  const variants = {
    default: 'bg-bg-card shadow-card',
    bordered: 'bg-bg-card border border-border',
    flat: 'bg-bg-subtle',
    interactive: 'bg-bg-card shadow-card hover:shadow-card-hover transition-shadow cursor-pointer',
  }

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  }

  return (
    <div
      className={`${base} ${variants[variant]} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

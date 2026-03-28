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
  const base = 'rounded-2xl transition-all duration-[var(--duration-normal)]'

  const variants = {
    default: 'bg-bg-card border border-border shadow-card',
    bordered: 'bg-bg-card border border-border',
    flat: 'bg-bg-subtle border border-border-light',
    interactive: 'bg-bg-card border border-border shadow-card hover:shadow-card-hover hover:border-border active:scale-[0.98] cursor-pointer',
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

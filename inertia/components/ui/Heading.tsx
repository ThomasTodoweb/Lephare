import { type ReactNode } from 'react'

type HeadingLevel = 1 | 2 | 3

interface HeadingProps {
  level: HeadingLevel
  children: ReactNode
  className?: string
}

const levelStyles: Record<HeadingLevel, string> = {
  1: 'text-h1', // 32px - uses --text-h1 CSS variable
  2: 'text-h2', // 24px - uses --text-h2 CSS variable
  3: 'text-h3', // 18px - uses --text-h3 CSS variable
}

export function Heading({ level, children, className = '' }: HeadingProps) {
  const Tag = `h${level}` as const
  const baseStyles = 'font-bolota uppercase font-bold text-text'
  const sizeStyles = levelStyles[level]

  return (
    <Tag className={`${baseStyles} ${sizeStyles} ${className}`}>
      {children}
    </Tag>
  )
}

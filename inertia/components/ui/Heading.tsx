import { type ReactNode } from 'react'

type HeadingLevel = 1 | 2 | 3

interface HeadingProps {
  level: HeadingLevel
  children: ReactNode
  className?: string
}

const levelStyles: Record<HeadingLevel, string> = {
  1: 'text-[26px] tracking-tight',
  2: 'text-[20px] tracking-tight',
  3: 'text-[17px]',
}

export function Heading({ level, children, className = '' }: HeadingProps) {
  const Tag = `h${level}` as const

  return (
    <Tag className={`font-bold text-text ${levelStyles[level]} ${className}`}>
      {children}
    </Tag>
  )
}

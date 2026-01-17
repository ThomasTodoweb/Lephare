import { type LabelHTMLAttributes } from 'react'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className = '', children, ...props }: LabelProps) {
  return (
    <label
      className={`block mb-2 font-medium text-text ${className}`}
      {...props}
    >
      {children}
    </label>
  )
}

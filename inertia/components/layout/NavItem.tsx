import { memo } from 'react'
import { Link } from '@inertiajs/react'
import type { LucideIcon } from 'lucide-react'

interface NavItemProps {
  icon: LucideIcon
  label: string
  href: string
  isActive: boolean
}

export const NavItem = memo(function NavItem({ icon: Icon, label, href, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`
        flex flex-col items-center justify-center gap-0.5 py-1 min-w-[52px]
        transition-colors duration-100
        active:opacity-60
        ${isActive ? 'text-text' : 'text-neutral-400'}
      `}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={20} strokeWidth={isActive ? 2.2 : 1.5} />
      <span className={`text-[10px] leading-none ${isActive ? 'font-semibold text-text' : 'font-medium text-neutral-400'}`}>
        {label}
      </span>
    </Link>
  )
})

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
        transition-all duration-100
        active:scale-90
        ${isActive ? 'text-text' : 'text-text-muted'}
      `}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={20} strokeWidth={isActive ? 2.2 : 1.5} />
      <span className={`text-[11px] leading-none ${isActive ? 'font-semibold text-text' : 'font-medium text-text-muted'}`}>
        {label}
      </span>
    </Link>
  )
})

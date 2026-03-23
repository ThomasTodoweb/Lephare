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
        flex flex-col items-center justify-center w-14 h-10 rounded-xl
        transition-all duration-150
        active:scale-90
        ${isActive ? 'text-text' : 'text-text-muted'}
      `}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={21} strokeWidth={isActive ? 2.2 : 1.6} />
      <span className={`text-[10px] mt-0.5 ${isActive ? 'font-semibold' : 'font-medium'}`}>
        {label}
      </span>
    </Link>
  )
})

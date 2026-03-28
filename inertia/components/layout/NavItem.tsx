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
        flex flex-col items-center justify-center gap-0.5 py-1 min-w-[56px] min-h-[44px]
        transition-all duration-[var(--duration-fast)]
        active:scale-90
        ${isActive ? 'text-primary' : 'text-text-muted'}
      `}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className={`relative ${isActive ? '' : ''}`}>
        <Icon size={22} strokeWidth={isActive ? 2.4 : 1.6} />
        {isActive && (
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
        )}
      </div>
      <span className={`text-[10px] leading-none mt-0.5 ${isActive ? 'font-bold text-primary' : 'font-medium text-text-muted'}`}>
        {label}
      </span>
    </Link>
  )
})

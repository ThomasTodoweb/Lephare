import { memo } from 'react'
import { Link } from '@inertiajs/react'
import type { LucideIcon } from 'lucide-react'

interface NavItemProps {
  icon: LucideIcon
  label: string
  href: string
  isActive: boolean
}

export const NavItem = memo(function NavItem({
  icon: Icon,
  label,
  href,
  isActive,
}: NavItemProps) {
  return (
    <Link
      href={href}
      className={`
        flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 min-w-[56px]
        transition-all duration-[var(--duration-fast)]
        active:scale-[0.92]
        ${isActive ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}
      `}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        size={22}
        strokeWidth={isActive ? 2.5 : 1.8}
        className="transition-all duration-[var(--duration-fast)]"
      />
      <span
        className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-text-muted'}`}
      >
        {label}
      </span>
    </Link>
  )
})

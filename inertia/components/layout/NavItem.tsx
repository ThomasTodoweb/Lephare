import { memo } from 'react'
import { Link } from '@inertiajs/react'
import type { LucideIcon } from 'lucide-react'

interface NavItemProps {
  icon: LucideIcon
  label: string
  href: string
  isActive: boolean
  showLabel?: boolean
}

export const NavItem = memo(function NavItem({
  icon: Icon,
  label,
  href,
  isActive,
  showLabel = false,
}: NavItemProps) {
  return (
    <Link
      href={href}
      className={`
        flex items-center justify-center gap-2 px-5 h-16 rounded-2xl
        transition-all duration-200 ease-out
        active:scale-[0.92] active:opacity-80
        ${
          isActive
            ? 'text-primary bg-primary/5 shadow-[0_2px_8px_rgba(221,44,12,0.15)]'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
        }
      `}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={32} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-150" />
      {showLabel && (
        <span
          key={href}
          aria-hidden="true"
          className="animate-fadeSlideIn bg-primary text-white rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shadow-md"
        >
          {label}
        </span>
      )}
    </Link>
  )
})

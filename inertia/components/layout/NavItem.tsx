import { Link } from '@inertiajs/react'
import type { LucideIcon } from 'lucide-react'

interface NavItemProps {
  icon: LucideIcon
  label: string
  href: string
  isActive: boolean
  showLabel?: boolean
}

export function NavItem({ icon: Icon, label, href, isActive, showLabel = false }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-center gap-2 px-3 h-12 transition-colors ${
        isActive ? 'text-primary' : 'text-gray-400'
      }`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
      {showLabel && (
        <span
          key={href}
          aria-hidden="true"
          className="animate-fadeSlideIn bg-primary text-white rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap"
        >
          {label}
        </span>
      )}
    </Link>
  )
}

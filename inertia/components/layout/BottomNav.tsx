import { usePage } from '@inertiajs/react'
import { Home, BookOpen, BarChart3, User, Calendar } from 'lucide-react'
import { NavItem } from './NavItem'

const NAV_ITEMS = [
  { label: 'Accueil', href: '/dashboard', icon: Home },
  { label: 'Calendrier', href: '/calendar', icon: Calendar },
  { label: 'Tutos', href: '/tutorials', icon: BookOpen },
  { label: 'Stats', href: '/statistics', icon: BarChart3 },
  { label: 'Profil', href: '/profile', icon: User },
] as const

export function BottomNav() {
  const { url } = usePage()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-black/[0.04]"
      aria-label="Navigation principale"
    >
      <div className="max-w-[430px] mx-auto flex justify-around items-center h-[52px] px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = url === item.href || url.startsWith(`${item.href}/`)
          return (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={isActive}
            />
          )
        })}
      </div>
      {/* Safe area bottom spacer for PWA */}
      <div className="h-[env(safe-area-inset-bottom,0px)] bg-white/90" />
    </nav>
  )
}

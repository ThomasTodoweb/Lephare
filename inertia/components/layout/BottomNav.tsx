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
      className="fixed bottom-5 left-5 right-5 glass rounded-2xl shadow-float z-50 safe-area-inset-bottom"
      aria-label="Navigation principale"
    >
      <div className="flex justify-around items-center h-14 px-1">
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
    </nav>
  )
}

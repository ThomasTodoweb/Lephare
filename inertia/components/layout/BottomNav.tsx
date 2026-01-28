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

// Note: Not memoized because usePage() hook returns new object on every render
// The child NavItem components ARE memoized for optimal performance
export function BottomNav() {
  const { url } = usePage()

  return (
    <nav
      className="fixed bottom-4 left-[8%] right-[8%] bg-white/95 backdrop-blur-md rounded-[32px] shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-white/50 z-50"
      aria-label="Navigation principale"
    >
      <div className="flex justify-around items-center h-[56px] px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = url === item.href || url.startsWith(`${item.href}/`)

          return (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={isActive}
              showLabel={isActive}
            />
          )
        })}
      </div>
    </nav>
  )
}

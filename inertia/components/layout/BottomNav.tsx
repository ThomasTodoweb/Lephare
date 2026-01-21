import { usePage } from '@inertiajs/react'
import { Home, BookOpen, BarChart3, User } from 'lucide-react'
import { NavItem } from './NavItem'

const NAV_ITEMS = [
  { label: 'Accueil', href: '/dashboard', icon: Home },
  { label: 'Tutos', href: '/tutorials', icon: BookOpen },
  { label: 'Stats', href: '/statistics', icon: BarChart3 },
  { label: 'Profil', href: '/profile', icon: User },
]

export function BottomNav() {
  const { url } = usePage()

  return (
    <nav
      className="fixed bottom-4 left-[15%] right-[15%] bg-white rounded-[30px] shadow-lg z-50"
      aria-label="Navigation principale"
    >
      <div className="flex justify-around items-center h-16 px-2">
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

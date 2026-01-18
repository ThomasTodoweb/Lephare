import { Link } from '@inertiajs/react'
import { Home, Target, BookOpen, User } from 'lucide-react'

type PageType = 'home' | 'missions' | 'tutorials' | 'profile'

interface BottomNavProps {
  currentPage?: PageType
}

const navItems = [
  { icon: Home, label: 'Accueil', href: '/dashboard', page: 'home' as PageType },
  { icon: Target, label: 'Missions', href: '/missions', page: 'missions' as PageType },
  { icon: BookOpen, label: 'Tutos', href: '/tutorials', page: 'tutorials' as PageType },
  { icon: User, label: 'Profil', href: '/profile', page: 'profile' as PageType },
]

export function BottomNav({ currentPage }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16 max-w-[428px] mx-auto">
        {navItems.map((item) => {
          const isActive = currentPage === item.page
          const Icon = item.icon

          return (
            <Link
              key={item.page}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-gray-500'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

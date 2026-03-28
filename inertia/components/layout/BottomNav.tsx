import { usePage, Link } from '@inertiajs/react'
import { Home, GraduationCap, TrendingUp, User, Camera } from 'lucide-react'
import { NavItem } from './NavItem'

const NAV_ITEMS_LEFT = [
  { label: 'Accueil', href: '/dashboard', icon: Home },
  { label: 'Apprendre', href: '/tutorials', icon: GraduationCap },
] as const

const NAV_ITEMS_RIGHT = [
  { label: 'Stats', href: '/statistics', icon: TrendingUp },
  { label: 'Profil', href: '/profile', icon: User },
] as const

export function BottomNav() {
  const { url } = usePage()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 glass-strong"
      aria-label="Navigation principale"
    >
      <div className="max-w-[430px] mx-auto flex justify-around items-center h-[56px] px-2 relative">
        {/* Left nav items */}
        {NAV_ITEMS_LEFT.map((item) => {
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

        {/* Central FAB */}
        <div className="relative flex items-center justify-center min-w-[56px]">
          <Link
            href="/missions"
            className="absolute -top-6 flex items-center justify-center w-[56px] h-[56px] rounded-full bg-primary shadow-glow-primary active:scale-95 transition-all duration-[var(--duration-fast)]"
            aria-label="Mission du jour"
          >
            <Camera size={24} className="text-white" strokeWidth={2} />
          </Link>
        </div>

        {/* Right nav items */}
        {NAV_ITEMS_RIGHT.map((item) => {
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
      <div className="h-[env(safe-area-inset-bottom,0px)]" />
    </nav>
  )
}

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
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-black/[0.04]"
      aria-label="Navigation principale"
    >
      <div className="max-w-[430px] mx-auto flex justify-around items-center h-[52px] px-2 relative">
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
        <div className="relative flex items-center justify-center min-w-[52px]">
          <Link
            href="/missions"
            className="absolute -top-5 flex items-center justify-center w-[52px] h-[52px] rounded-full bg-[#dd2c0c] shadow-lg active:scale-95 transition-transform"
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
      <div className="h-[env(safe-area-inset-bottom,0px)] bg-white/90" />
    </nav>
  )
}

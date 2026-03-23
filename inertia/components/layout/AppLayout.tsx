import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface AppLayoutProps {
  children: ReactNode
  showBottomNav?: boolean
}

export function AppLayout({ children, showBottomNav = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-bg">
      {/* PWA safe area top spacer */}
      <div className="h-[env(safe-area-inset-top,0px)]" />

      <main className={showBottomNav ? 'pb-24' : ''}>
        <div className="max-w-[430px] mx-auto px-5 pt-4 pb-4">
          {children}
        </div>
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  )
}

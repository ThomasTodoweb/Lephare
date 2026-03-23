import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface AppLayoutProps {
  children: ReactNode
  showBottomNav?: boolean
}

export function AppLayout({ children, showBottomNav = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-bg pt-[calc(env(safe-area-inset-top)*0.5)]">
      <main className={showBottomNav ? 'pb-28' : ''}>
        <div className="max-w-[430px] mx-auto px-5 pt-3 pb-4">
          {children}
        </div>
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  )
}

import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface AppLayoutProps {
  children: ReactNode
  showBottomNav?: boolean
}

export function AppLayout({ children, showBottomNav = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background pt-[calc(env(safe-area-inset-top)*0.7)]">
      <main className={showBottomNav ? 'pb-20' : ''}>
        <div className="max-w-[428px] mx-auto px-5 py-4">
          {children}
        </div>
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  )
}

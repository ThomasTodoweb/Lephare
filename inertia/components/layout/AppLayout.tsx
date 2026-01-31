import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface AppLayoutProps {
  children: ReactNode
  showBottomNav?: boolean
}

// Note: Not memoized because `children` prop creates new reference on every render
// Memoization would add overhead without benefit
// NOTE: Header removed - notifications feature disabled (see CLAUDE.md)
export function AppLayout({ children, showBottomNav = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background pt-[env(safe-area-inset-top)]">
      <main className={showBottomNav ? 'pb-24' : ''}>
        <div className="max-w-[428px] mx-auto px-4 py-4">
          {children}
        </div>
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  )
}

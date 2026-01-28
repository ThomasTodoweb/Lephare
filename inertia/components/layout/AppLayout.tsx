import type { ReactNode } from 'react'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

interface AppLayoutProps {
  children: ReactNode
  showBottomNav?: boolean
}

// Note: Not memoized because `children` prop creates new reference on every render
// Memoization would add overhead without benefit
export function AppLayout({ children, showBottomNav = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className={showBottomNav ? 'pb-24' : ''}>
        <div className="max-w-[428px] mx-auto px-4 py-4">
          {children}
        </div>
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  )
}

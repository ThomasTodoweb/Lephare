import { type ReactNode } from 'react'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

interface AppLayoutProps {
  children: ReactNode
  showBottomNav?: boolean
}

export function AppLayout({
  children,
  showBottomNav = true,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 overflow-auto pb-24">
        <div className="max-w-[428px] mx-auto px-4 py-4">
          {children}
        </div>
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  )
}

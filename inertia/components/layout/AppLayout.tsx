import { type ReactNode } from 'react'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

type PageType = 'home' | 'missions' | 'tutorials' | 'profile'

interface AppLayoutProps {
  children: ReactNode
  showBottomNav?: boolean
  currentPage?: PageType
}

export function AppLayout({
  children,
  showBottomNav = true,
  currentPage,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 overflow-auto pb-20">
        <div className="max-w-[428px] mx-auto px-4 py-4">
          {children}
        </div>
      </main>
      {showBottomNav && <BottomNav currentPage={currentPage} />}
    </div>
  )
}

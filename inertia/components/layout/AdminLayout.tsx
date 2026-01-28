import { type ReactNode, useState } from 'react'
import { Link, usePage } from '@inertiajs/react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
  title?: string
}

interface NavItem {
  href: string
  label: string
  icon: string
}

interface NavGroup {
  label: string
  icon: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Dashboard',
    icon: '📊',
    items: [
      { href: '/admin', label: 'Vue d\'ensemble', icon: '📊' },
    ],
  },
  {
    label: 'Utilisateurs',
    icon: '👥',
    items: [
      { href: '/admin/users', label: 'Utilisateurs', icon: '👥' },
      { href: '/admin/subscriptions', label: 'Abonnements', icon: '💳' },
    ],
  },
  {
    label: 'Contenu',
    icon: '📝',
    items: [
      { href: '/admin/strategies', label: 'Stratégies', icon: '🎯' },
      { href: '/admin/templates', label: 'Templates', icon: '📝' },
      { href: '/admin/tutorials', label: 'Tutoriels', icon: '📚' },
    ],
  },
  {
    label: 'Gamification',
    icon: '🏆',
    items: [
      { href: '/admin/levels', label: 'Niveaux & XP', icon: '⭐' },
      { href: '/admin/badges', label: 'Badges', icon: '🏅' },
    ],
  },
  {
    label: 'Engagement',
    icon: '📈',
    items: [
      { href: '/admin/alerts', label: 'Alertes', icon: '🔔' },
      { href: '/admin/reports', label: 'Rapports', icon: '📈' },
      { href: '/admin/emails', label: 'Emails', icon: '📧' },
    ],
  },
  {
    label: 'Paramètres',
    icon: '⚙️',
    items: [
      { href: '/admin/settings', label: 'Configuration', icon: '⚙️' },
    ],
  },
]

export function AdminLayout({ children, title = 'Administration' }: AdminLayoutProps) {
  const { url } = usePage()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auto-open groups that have an active item
  const getInitialOpenGroups = () => {
    const open: Record<string, boolean> = {}
    navGroups.forEach((group) => {
      const hasActiveItem = group.items.some(
        (item) => url === item.href || (item.href !== '/admin' && url.startsWith(item.href))
      )
      open[group.label] = hasActiveItem
    })
    return open
  }

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(getInitialOpenGroups)

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-neutral-900 text-white flex flex-col transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-neutral-800">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-2xl">⚓</span>
            <span className="font-bold text-lg">Le Phare Admin</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navGroups.map((group) => {
            const isOpen = openGroups[group.label] ?? false
            const isSingleItem = group.items.length === 1

            // Single-item groups render as a direct link
            if (isSingleItem) {
              const item = group.items[0]
              const isActive = url === item.href || (item.href !== '/admin' && url.startsWith(item.href))
              return (
                <Link
                  key={group.label}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{group.icon}</span>
                  <span>{group.label}</span>
                </Link>
              )
            }

            // Multi-item groups render as collapsible
            return (
              <div key={group.label}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white w-full transition-colors"
                >
                  <span className="text-sm">{group.icon}</span>
                  <span className="flex-1 text-left">{group.label}</span>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-neutral-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-500" />
                  )}
                </button>
                {isOpen && (
                  <div className="ml-4 border-l border-neutral-700 pl-2">
                    {group.items.map((item) => {
                      const isActive = url === item.href || (item.href !== '/admin' && url.startsWith(item.href))
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                            isActive
                              ? 'bg-primary text-white rounded-lg'
                              : 'text-neutral-400 hover:bg-neutral-800 hover:text-white rounded-lg'
                          }`}
                        >
                          <span className="text-sm">{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <span>←</span>
            <span>Retour à l'app</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-neutral-200 px-4 lg:px-6 py-4 flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"
            aria-label="Ouvrir le menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-neutral-900 flex-1">{title}</h1>
          <div className="hidden sm:flex items-center gap-2 text-sm text-neutral-500">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Administrateur</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

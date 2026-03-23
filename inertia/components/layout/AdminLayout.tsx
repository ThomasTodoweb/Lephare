import { type ReactNode, useState } from 'react'
import { Link, usePage } from '@inertiajs/react'
import {
  LayoutDashboard, Users, CreditCard, Target, FileText, Lightbulb,
  BookOpen, Download, Trophy, Bell, BarChart3, Mail, FileSearch,
  FolderOpen, ArrowLeft, Menu, X
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
  title?: string
}

interface NavLink {
  type: 'link'
  href: string
  label: string
  icon: LucideIcon
}

interface NavSeparator {
  type: 'separator'
  label: string
}

type NavEntry = NavLink | NavSeparator

const navigation: NavEntry[] = [
  { type: 'link', href: '/admin', label: 'Dashboard', icon: LayoutDashboard },

  { type: 'separator', label: 'Gestion' },
  { type: 'link', href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { type: 'link', href: '/admin/subscriptions', label: 'Abonnements', icon: CreditCard },

  { type: 'separator', label: 'Contenu' },
  { type: 'link', href: '/admin/strategies', label: 'Stratégies', icon: Target },
  { type: 'link', href: '/admin/templates', label: 'Missions', icon: FileText },
  { type: 'link', href: '/admin/ideas', label: 'Idées', icon: Lightbulb },
  { type: 'link', href: '/admin/categories', label: 'Catégories', icon: FolderOpen },
  { type: 'link', href: '/admin/tutorials', label: 'Tutoriels', icon: BookOpen },
  { type: 'link', href: '/admin/notion', label: 'Import Notion', icon: Download },

  { type: 'separator', label: 'Gamification' },
  { type: 'link', href: '/admin/levels', label: 'Niveaux & XP', icon: Trophy },

  { type: 'separator', label: 'Engagement' },
  { type: 'link', href: '/admin/alerts', label: 'Alertes', icon: Bell },
  { type: 'link', href: '/admin/reports', label: 'Rapports', icon: BarChart3 },
  { type: 'link', href: '/admin/emails', label: 'Emails', icon: Mail },
  { type: 'link', href: '/admin/email-logs', label: 'Logs emails', icon: FileSearch },
]

export function AdminLayout({ children, title = 'Administration' }: AdminLayoutProps) {
  const { url } = usePage()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isLinkActive = (href: string) => {
    if (href === '/admin') return url === '/admin' || url === '/admin/'
    return url === href || url.startsWith(href + '/')
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-60 bg-neutral-950 text-neutral-400
          flex flex-col transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-neutral-800/50">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-[15px] font-bold text-white">Le Phare</span>
            <span className="text-[11px] font-medium text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded">Admin</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-neutral-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navigation.map((entry, i) => {
            if (entry.type === 'separator') {
              return (
                <div key={i} className="px-4 pt-5 pb-1">
                  <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">
                    {entry.label}
                  </span>
                </div>
              )
            }

            const active = isLinkActive(entry.href)
            return (
              <Link
                key={entry.href}
                href={entry.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-2.5 mx-2 px-2.5 py-2 text-[13px] rounded-lg transition-colors
                  ${active
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                  }
                `}
              >
                <entry.icon size={16} strokeWidth={active ? 2 : 1.5} />
                <span>{entry.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800/50">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-2.5 py-2 text-[13px] text-neutral-500 hover:text-neutral-200 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Retour à l'app</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-neutral-200 px-4 lg:px-6 flex items-center gap-3 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 -ml-1 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-[15px] font-semibold text-neutral-900 flex-1">{title}</h1>
          <div className="hidden sm:flex items-center gap-2 text-[12px] text-neutral-500">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            Admin
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

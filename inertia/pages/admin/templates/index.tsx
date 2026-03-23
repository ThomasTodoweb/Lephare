import { Head, Link, router } from '@inertiajs/react'
import { useState, useMemo } from 'react'
import { AdminLayout } from '~/components/layout'
import { Card, Button } from '~/components/ui'
import {
  Plus, GripVertical, Edit, Trash2, Eye, EyeOff,
  Image, Film, Smartphone, MessageSquare, Layers,
  Search, ChevronDown, BookOpen, Bell, Lock
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// --- Types ---

interface Template {
  id: number
  strategyId: number
  strategyName: string
  type: 'post' | 'carousel' | 'story' | 'reel' | 'engagement'
  title: string
  contentIdea: string
  order: number
  isActive: boolean
  tutorialId: number | null
  tutorialTitle: string | null
  requiredTutorialId: number | null
  requiredTutorialTitle: string | null
  notificationTime: string | null
}

interface Strategy {
  id: number
  name: string
}

interface Props {
  templates: Template[]
  strategies: Strategy[]
  currentFilter: string | null
  currentTypeFilter: string | null
}

// --- Config ---

interface TypeConfig {
  label: string
  icon: LucideIcon
  color: string
  bg: string
  border: string
}

const typeConfig: Record<string, TypeConfig> = {
  post: { label: 'Post', icon: Image, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  carousel: { label: 'Carrousel', icon: Layers, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  story: { label: 'Story', icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  reel: { label: 'Reel', icon: Film, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  engagement: { label: 'Engagement', icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
}

const kanbanColumns = ['post', 'carousel', 'story', 'reel', 'engagement'] as const

// --- Sub-components ---

function KanbanCard({
  template,
  onToggle,
  onDelete,
}: {
  template: Template
  onToggle: () => void
  onDelete: () => void
}) {
  const config = typeConfig[template.type] || typeConfig.post
  const [showPreview, setShowPreview] = useState(false)

  return (
    <div
      className={`bg-white rounded-xl border border-neutral-150 shadow-sm hover:shadow-md transition-all group ${
        !template.isActive ? 'opacity-50' : ''
      }`}
    >
      {/* Card Header */}
      <div className="px-3.5 pt-3.5 pb-2">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 cursor-grab text-neutral-300 hover:text-neutral-500 transition-colors">
            <GripVertical size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-neutral-900 leading-tight line-clamp-2">
              {template.title}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              {template.strategyName} - #{template.order}
            </p>
          </div>
        </div>
      </div>

      {/* Preview toggle */}
      {showPreview && (
        <div className="px-3.5 pb-2">
          <div className={`${config.bg} rounded-lg p-2.5 text-[12px] text-neutral-600 leading-relaxed`}>
            {template.contentIdea}
          </div>
        </div>
      )}

      {/* Meta tags */}
      <div className="px-3.5 pb-2 flex flex-wrap gap-1">
        {template.tutorialTitle && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-purple-50 text-purple-600 rounded-md">
            <BookOpen size={10} /> Tuto
          </span>
        )}
        {template.requiredTutorialTitle && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-amber-50 text-amber-600 rounded-md">
            <Lock size={10} /> Prérequis
          </span>
        )}
        {template.notificationTime && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-600 rounded-md">
            <Bell size={10} /> {template.notificationTime}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="px-3.5 py-2.5 border-t border-neutral-100 flex items-center justify-between">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="text-neutral-400 hover:text-neutral-600 transition-colors p-1"
          title="Aperçu"
        >
          {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggle}
            className={`p-1 rounded transition-colors ${
              template.isActive
                ? 'text-green-500 hover:bg-green-50'
                : 'text-neutral-300 hover:bg-neutral-50'
            }`}
            title={template.isActive ? 'Désactiver' : 'Activer'}
          >
            <span className={`block w-2 h-2 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-neutral-300'}`} />
          </button>
          <Link
            href={`/admin/templates/${template.id}/edit`}
            className="p-1 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Edit size={14} />
          </Link>
          <button
            onClick={onDelete}
            className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Main Component ---

export default function AdminTemplatesIndex({ templates, strategies, currentFilter, currentTypeFilter }: Props) {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [search, setSearch] = useState('')
  const [strategyFilter, setStrategyFilter] = useState(currentFilter || '')
  const [deleting, setDeleting] = useState<number | null>(null)

  // Group templates by type for kanban
  const groupedTemplates = useMemo(() => {
    let filtered = templates

    if (search) {
      const s = search.toLowerCase()
      filtered = filtered.filter(
        (t) => t.title.toLowerCase().includes(s) || t.contentIdea.toLowerCase().includes(s)
      )
    }

    const groups: Record<string, Template[]> = {}
    for (const col of kanbanColumns) {
      groups[col] = filtered
        .filter((t) => t.type === col)
        .sort((a, b) => a.order - b.order)
    }
    return groups
  }, [templates, search])

  const handleFilterChange = (strategyId: string) => {
    setStrategyFilter(strategyId)
    const params: Record<string, string> = {}
    if (strategyId) params.strategy = strategyId
    if (currentTypeFilter) params.type = currentTypeFilter
    router.get('/admin/templates', params, { preserveState: true })
  }

  const handleToggle = (id: number) => {
    router.post(`/admin/templates/${id}/toggle`, {}, { preserveScroll: true })
  }

  const handleDelete = (id: number) => {
    if (confirm('Supprimer cette mission ?')) {
      setDeleting(id)
      router.delete(`/admin/templates/${id}`, {
        preserveScroll: true,
        onFinish: () => setDeleting(null),
      })
    }
  }

  return (
    <AdminLayout title="Missions">
      <Head title="Missions - Admin Le Phare" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
        <div className="flex items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative max-w-xs flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-3 py-2 text-[13px] bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
          </div>

          {/* Strategy filter */}
          <div className="relative">
            <select
              value={strategyFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-[13px] bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Toutes les stratégies</option>
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-neutral-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'
              }`}
            >
              Liste
            </button>
          </div>

          <Link href="/admin/templates/create">
            <Button size="sm" icon={Plus}>
              Nouvelle mission
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mb-5 overflow-x-auto pb-1">
        {kanbanColumns.map((type) => {
          const config = typeConfig[type]
          const Icon = config.icon
          const count = templates.filter((t) => t.type === type).length
          const active = templates.filter((t) => t.type === type && t.isActive).length
          return (
            <div key={type} className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl ${config.bg} shrink-0`}>
              <Icon size={16} className={config.color} />
              <div>
                <p className={`text-[13px] font-semibold ${config.color}`}>{count}</p>
                <p className="text-[10px] text-neutral-500">{config.label} ({active} actives)</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {kanbanColumns.map((type) => {
            const config = typeConfig[type]
            const Icon = config.icon
            const cards = groupedTemplates[type] || []

            return (
              <div key={type} className="flex flex-col">
                {/* Column Header */}
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${config.bg} mb-3`}>
                  <Icon size={16} className={config.color} />
                  <span className={`text-[13px] font-semibold ${config.color}`}>{config.label}</span>
                  <span className="ml-auto text-[12px] text-neutral-400 font-medium">{cards.length}</span>
                </div>

                {/* Cards */}
                <div className="space-y-2.5 flex-1">
                  {cards.map((template) => (
                    <KanbanCard
                      key={template.id}
                      template={template}
                      onToggle={() => handleToggle(template.id)}
                      onDelete={() => handleDelete(template.id)}
                    />
                  ))}

                  {cards.length === 0 && (
                    <div className="border-2 border-dashed border-neutral-200 rounded-xl py-8 text-center">
                      <p className="text-[12px] text-neutral-400">Aucune mission</p>
                    </div>
                  )}

                  {/* Quick add */}
                  <Link
                    href={`/admin/templates/create?type=${type}`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-dashed border-neutral-200 rounded-xl text-[12px] text-neutral-400 hover:text-neutral-600 hover:border-neutral-300 transition-colors"
                  >
                    <Plus size={14} />
                    Ajouter
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card padding="none" className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Mission</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Stratégie</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Ordre</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates
                .filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.contentIdea.toLowerCase().includes(search.toLowerCase()))
                .map((template) => {
                  const config = typeConfig[template.type] || typeConfig.post
                  const Icon = config.icon
                  return (
                    <tr key={template.id} className={`border-b border-neutral-50 hover:bg-neutral-50/50 ${!template.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-medium text-neutral-900">{template.title}</p>
                        <p className="text-[12px] text-neutral-500 line-clamp-1">{template.contentIdea}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium ${config.bg} ${config.color}`}>
                          <Icon size={12} /> {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-neutral-600">{template.strategyName}</td>
                      <td className="px-4 py-3 text-[13px] text-neutral-600 font-mono">#{template.order}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${template.isActive ? 'text-green-600' : 'text-neutral-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-neutral-300'}`} />
                          {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggle(template.id)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                          >
                            {template.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <Link
                            href={`/admin/templates/${template.id}/edit`}
                            className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(template.id)}
                            disabled={deleting === template.id}
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
          {templates.length === 0 && (
            <div className="text-center py-16">
              <p className="text-[13px] text-neutral-500 mb-2">Aucune mission trouvée</p>
              <Link href="/admin/templates/create" className="text-[13px] text-primary font-medium hover:underline">
                Créer votre première mission
              </Link>
            </div>
          )}
        </Card>
      )}
    </AdminLayout>
  )
}

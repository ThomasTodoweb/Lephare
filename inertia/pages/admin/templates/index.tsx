import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { AdminLayout } from '~/components/layout'
import { Card, Button } from '~/components/ui'

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
  missionsCount: number
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

// Les tutos sont gérés séparément dans /admin/tutorials
const typeLabels: Record<string, { label: string; icon: string; color: string }> = {
  post: { label: 'Post', icon: '📸', color: 'bg-blue-100 text-blue-700' },
  carousel: { label: 'Carrousel', icon: '🎠', color: 'bg-green-100 text-green-700' },
  story: { label: 'Story', icon: '📱', color: 'bg-purple-100 text-purple-700' },
  reel: { label: 'Reel', icon: '🎬', color: 'bg-red-100 text-red-700' },
  engagement: { label: 'Engagement', icon: '💬', color: 'bg-amber-100 text-amber-700' },
}

export default function AdminTemplatesIndex({ templates, strategies, currentFilter, currentTypeFilter }: Props) {
  const [deleting, setDeleting] = useState<number | null>(null)

  const handleFilterChange = (strategyId: string) => {
    const params: Record<string, string> = {}
    if (strategyId) params.strategy = strategyId
    if (currentTypeFilter) params.type = currentTypeFilter
    router.get('/admin/templates', params, { preserveState: true })
  }

  const handleTypeFilterChange = (type: string) => {
    const params: Record<string, string> = {}
    if (currentFilter) params.strategy = currentFilter
    if (type) params.type = type
    router.get('/admin/templates', params, { preserveState: true })
  }

  const handleToggle = (id: number) => {
    router.post(`/admin/templates/${id}/toggle`, {}, { preserveScroll: true })
  }

  const handleDelete = (id: number, missionsCount: number) => {
    if (missionsCount > 0) {
      alert(`Ce template est utilisé par ${missionsCount} mission(s). Vous ne pouvez pas le supprimer.`)
      return
    }

    if (confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      setDeleting(id)
      router.delete(`/admin/templates/${id}`, {
        preserveScroll: true,
        onFinish: () => setDeleting(null),
      })
    }
  }

  return (
    <AdminLayout title="Templates de missions">
      <Head title="Templates - Admin Le Phare" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <Link href="/admin/templates/create">
          <Button>+ Nouveau template</Button>
        </Link>
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => handleTypeFilterChange('')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            !currentTypeFilter
              ? 'bg-primary text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          Tous
        </button>
        {Object.entries(typeLabels).map(([type, { label, icon }]) => (
          <button
            key={type}
            onClick={() => handleTypeFilterChange(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentTypeFilter === type
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Strategy filter */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-neutral-500">Stratégie:</span>
        <select
          value={currentFilter || ''}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-neutral-200 text-sm"
        >
          <option value="">Toutes</option>
          {strategies.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <p className="text-neutral-500 text-sm mb-4">{templates.length} template(s)</p>

      {/* Templates list */}
      <div className="space-y-3">
        {templates.map((template) => (
          <Card key={template.id} className="flex items-start gap-4">
            {/* Type badge */}
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${typeLabels[template.type]?.color || 'bg-neutral-100'}`}
            >
              {typeLabels[template.type]?.icon || '📌'}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-neutral-900">{template.title}</h3>
                {!template.isActive && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-neutral-100 text-neutral-500">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-500 mb-2">
                {template.strategyName} • Ordre: {template.order}
              </p>
              <p className="text-sm text-neutral-600 line-clamp-1">{template.contentIdea}</p>
              {template.tutorialTitle && (
                <p className="text-xs text-primary mt-1">📚 {template.tutorialTitle}</p>
              )}
              {template.requiredTutorialTitle && (
                <p className="text-xs text-amber-600 mt-1">
                  🔒 Prérequis: {template.requiredTutorialTitle}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="text-center text-sm">
              <p className="font-bold text-neutral-900">{template.missionsCount}</p>
              <p className="text-xs text-neutral-500">missions</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Link href={`/admin/templates/${template.id}/edit`}>
                <Button variant="outlined" className="w-full text-sm">
                  Modifier
                </Button>
              </Link>
              <button
                onClick={() => handleToggle(template.id)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  template.isActive
                    ? 'border-green-500 text-green-600'
                    : 'border-neutral-300 text-neutral-500'
                }`}
              >
                {template.isActive ? 'Active' : 'Inactive'}
              </button>
              <button
                onClick={() => handleDelete(template.id, template.missionsCount)}
                disabled={deleting === template.id}
                className="px-3 py-1.5 text-xs rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
              >
                {deleting === template.id ? '...' : 'Suppr.'}
              </button>
            </div>
          </Card>
        ))}

        {templates.length === 0 && (
          <Card className="text-center py-12">
            <span className="text-4xl block mb-2">📝</span>
            <p className="text-neutral-500">Aucun template trouvé</p>
            <Link href="/admin/templates/create" className="text-primary text-sm mt-2 inline-block">
              Créer votre premier template →
            </Link>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}

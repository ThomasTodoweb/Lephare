import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { AdminLayout } from '~/components/layout'
import { Card, Button } from '~/components/ui'

interface Tutorial {
  id: number
  categoryId: number
  categoryName: string
  title: string
  description: string | null
  videoUrl: string | null
  durationMinutes: number
  order: number
  isActive: boolean
  completionsCount: number
}

interface Category {
  id: number
  name: string
}

interface Props {
  tutorials: Tutorial[]
  categories: Category[]
  currentFilter: string | null
}

export default function AdminTutorialsIndex({ tutorials, categories, currentFilter }: Props) {
  const [deleting, setDeleting] = useState<number | null>(null)

  const handleFilterChange = (categoryId: string) => {
    router.get('/admin/tutorials', categoryId ? { category: categoryId } : {}, { preserveState: true })
  }

  const handleToggle = (id: number) => {
    router.post(`/admin/tutorials/${id}/toggle`, {}, { preserveScroll: true })
  }

  const handleDelete = (id: number, completionsCount: number) => {
    if (completionsCount > 0) {
      alert(`Ce tutoriel a été complété ${completionsCount} fois. Vous ne pouvez pas le supprimer.`)
      return
    }

    if (confirm('Êtes-vous sûr de vouloir supprimer ce tutoriel ?')) {
      setDeleting(id)
      router.delete(`/admin/tutorials/${id}`, {
        preserveScroll: true,
        onFinish: () => setDeleting(null),
      })
    }
  }

  return (
    <AdminLayout title="Tutoriels">
      <Head title="Tutoriels - Admin Le Phare" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        {/* Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Filtrer par catégorie:</span>
          <select
            value={currentFilter || ''}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-3 py-2 rounded-lg border border-neutral-200 text-sm"
          >
            <option value="">Toutes</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <Link href="/admin/tutorials/create">
          <Button>+ Nouveau tutoriel</Button>
        </Link>
      </div>

      <p className="text-neutral-500 text-sm mb-4">{tutorials.length} tutoriel(s)</p>

      {/* Tutorials list */}
      <div className="space-y-3">
        {tutorials.map((tutorial) => (
          <Card key={tutorial.id} className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
              📚
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-neutral-900">{tutorial.title}</h3>
                {tutorial.videoUrl && <span className="text-xs text-neutral-400">🎥</span>}
                {!tutorial.isActive && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-neutral-100 text-neutral-500">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-500 mb-1">
                {tutorial.categoryName} • {tutorial.durationMinutes} min • Ordre: {tutorial.order}
              </p>
              {tutorial.description && (
                <p className="text-sm text-neutral-600 line-clamp-1">{tutorial.description}</p>
              )}
            </div>

            {/* Stats */}
            <div className="text-center text-sm">
              <p className="font-bold text-neutral-900">{tutorial.completionsCount}</p>
              <p className="text-xs text-neutral-500">vues</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Link href={`/admin/tutorials/${tutorial.id}/edit`}>
                <Button variant="outlined" className="w-full text-sm">
                  Modifier
                </Button>
              </Link>
              <button
                onClick={() => handleToggle(tutorial.id)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  tutorial.isActive
                    ? 'border-green-500 text-green-600'
                    : 'border-neutral-300 text-neutral-500'
                }`}
              >
                {tutorial.isActive ? 'Active' : 'Inactive'}
              </button>
              <button
                onClick={() => handleDelete(tutorial.id, tutorial.completionsCount)}
                disabled={deleting === tutorial.id}
                className="px-3 py-1.5 text-xs rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
              >
                {deleting === tutorial.id ? '...' : 'Suppr.'}
              </button>
            </div>
          </Card>
        ))}

        {tutorials.length === 0 && (
          <Card className="text-center py-12">
            <span className="text-4xl block mb-2">📚</span>
            <p className="text-neutral-500">Aucun tutoriel trouvé</p>
            <Link href="/admin/tutorials/create" className="text-primary text-sm mt-2 inline-block">
              Créer votre premier tutoriel →
            </Link>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}

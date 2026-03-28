import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { AdminLayout } from '~/components/layout'
import { Card, Button } from '~/components/ui'
import { BookOpen, Video, Plus } from 'lucide-react'

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
          <Button icon={Plus}>Nouveau tutoriel</Button>
        </Link>
      </div>

      <p className="text-neutral-500 text-sm mb-4">{tutorials.length} tutoriel(s)</p>

      {/* Tutorials list */}
      <div className="space-y-3">
        {tutorials.map((tutorial) => (
          <Card key={tutorial.id} className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <BookOpen size={20} className="text-purple-600" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-neutral-900">{tutorial.title}</h3>
                {tutorial.videoUrl && <Video size={14} className="text-neutral-400" />}
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
                <Button variant="secondary" className="w-full text-sm">
                  Modifier
                </Button>
              </Link>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleToggle(tutorial.id)}
              >
                {tutorial.isActive ? 'Active' : 'Inactive'}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDelete(tutorial.id, tutorial.completionsCount)}
                disabled={deleting === tutorial.id}
              >
                {deleting === tutorial.id ? '...' : 'Suppr.'}
              </Button>
            </div>
          </Card>
        ))}

        {tutorials.length === 0 && (
          <Card className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
              <BookOpen size={24} className="text-neutral-400" />
            </div>
            <p className="text-[13px] text-neutral-500 mb-2">Aucun tutoriel trouvé</p>
            <Link href="/admin/tutorials/create" className="text-primary text-[13px] font-medium hover:underline">
              Créer votre premier tutoriel
            </Link>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}

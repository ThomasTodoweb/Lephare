import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { AdminLayout } from '~/components/layout'
import { Card, Button } from '~/components/ui'
import { Target, Plus } from 'lucide-react'

interface Strategy {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  isActive: boolean
  restaurantsCount: number
  templatesCount: number
  createdAt: string
}

interface Props {
  strategies: Strategy[]
}

export default function AdminStrategiesIndex({ strategies }: Props) {
  const [deleting, setDeleting] = useState<number | null>(null)

  const handleToggle = (id: number) => {
    router.post(`/admin/strategies/${id}/toggle`, {}, { preserveScroll: true })
  }

  const handleDelete = (id: number, restaurantsCount: number) => {
    if (restaurantsCount > 0) {
      alert(`Cette stratégie est utilisée par ${restaurantsCount} restaurant(s). Vous ne pouvez pas la supprimer.`)
      return
    }

    if (confirm('Êtes-vous sûr de vouloir supprimer cette stratégie ?')) {
      setDeleting(id)
      router.delete(`/admin/strategies/${id}`, {
        preserveScroll: true,
        onFinish: () => setDeleting(null),
      })
    }
  }

  return (
    <AdminLayout title="Stratégies">
      <Head title="Stratégies - Admin Le Phare" />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-neutral-500">{strategies.length} stratégie(s)</p>
        <Link href="/admin/strategies/create">
          <Button icon={Plus}>Nouvelle stratégie</Button>
        </Link>
      </div>

      {/* Strategies list */}
      <div className="space-y-4">
        {strategies.map((strategy) => (
          <Card key={strategy.id} className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-16 h-16 rounded-lg bg-neutral-100 flex items-center justify-center text-3xl flex-shrink-0">
              {strategy.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-neutral-900 flex items-center gap-2">
                    {strategy.name}
                    {!strategy.isActive && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-neutral-100 text-neutral-500">
                        Inactive
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-neutral-500">/{strategy.slug}</p>
                </div>
              </div>

              <p className="text-sm text-neutral-600 mt-2 line-clamp-2">{strategy.description}</p>

              {/* Stats */}
              <div className="flex gap-4 mt-3 text-xs text-neutral-500">
                <span>{strategy.restaurantsCount} restaurant(s)</span>
                <span>{strategy.templatesCount} template(s)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Link href={`/admin/strategies/${strategy.id}/edit`}>
                <Button variant="secondary" className="w-full text-sm">
                  Modifier
                </Button>
              </Link>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleToggle(strategy.id)}
              >
                {strategy.isActive ? 'Active' : 'Inactive'}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDelete(strategy.id, strategy.restaurantsCount)}
                disabled={deleting === strategy.id}
              >
                {deleting === strategy.id ? '...' : 'Supprimer'}
              </Button>
            </div>
          </Card>
        ))}

        {strategies.length === 0 && (
          <Card className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
              <Target size={24} className="text-neutral-400" />
            </div>
            <p className="text-[13px] text-neutral-500 mb-2">Aucune stratégie créée</p>
            <Link href="/admin/strategies/create" className="text-primary text-[13px] font-medium hover:underline">
              Créer votre première stratégie
            </Link>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}

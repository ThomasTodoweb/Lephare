import { Head, Link } from '@inertiajs/react'
import { Card } from '~/components/ui/Card'

interface MissionHistory {
  id: number
  status: 'pending' | 'completed' | 'skipped'
  assignedAt: string
  completedAt: string | null
  template: {
    type: 'post' | 'story' | 'reel' | 'tuto'
    title: string
  }
}

interface Props {
  missions: MissionHistory[]
}

const TYPE_ICONS: Record<string, string> = {
  post: '📸',
  story: '📱',
  reel: '🎬',
  tuto: '🎓',
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Complétée' },
  skipped: { bg: 'bg-neutral-100', text: 'text-neutral-600', label: 'Passée' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En cours' },
}

export default function MissionHistory({ missions }: Props) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  return (
    <>
      <Head title="Historique missions - Le Phare" />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/missions" className="text-primary">
              ← Retour
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Historique
          </h1>
          <p className="text-neutral-600 mt-2">
            Vos missions passées
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-8">
          {missions.length > 0 ? (
            <div className="space-y-4">
              {missions.map((mission) => {
                const style = STATUS_STYLES[mission.status]
                return (
                  <Card key={mission.id} className="!p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center text-xl">
                        {TYPE_ICONS[mission.template.type]}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-neutral-900 text-sm">
                          {mission.template.title}
                        </h3>
                        <p className="text-xs text-neutral-500">
                          {formatDate(mission.assignedAt)}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">📋</span>
              </div>
              <h2 className="text-lg font-bold text-neutral-900 mb-2">
                Aucune mission
              </h2>
              <p className="text-neutral-600 text-center text-sm">
                Vos missions apparaîtront ici une fois que vous en aurez complété.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

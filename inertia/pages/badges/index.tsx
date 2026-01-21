import { Head, Link } from '@inertiajs/react'
import { AppLayout } from '~/components/layout'
import { Card } from '~/components/ui'

interface Badge {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string
  criteriaType: string
  criteriaValue: number
  unlocked: boolean
  unlockedAt: string | null
}

interface Stats {
  unlockedCount: number
  totalCount: number
  currentStreak: number
  longestStreak: number
}

interface Props {
  badges: Badge[]
  stats: Stats
}

const CRITERIA_LABELS: Record<string, string> = {
  missions_completed: 'missions complétées',
  streak_days: 'jours de streak',
  tutorials_viewed: 'tutoriels vus',
}

export default function BadgesIndex({ badges, stats }: Props) {
  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <AppLayout currentPage="profile">
      <Head title="Mes Badges - Le Phare" />

      <div className="py-4">
        {/* Header */}
        <div className="mb-6">
          <Link href="/profile" className="text-primary text-sm mb-2 inline-block">
            ← Retour au profil
          </Link>
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Mes Badges
          </h1>
          <p className="text-neutral-600 mt-1">
            Collectionnez les badges en progressant !
          </p>
        </div>

        {/* Progress overview */}
        <Card className="mb-6 bg-primary/5 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold text-primary">
                {stats.unlockedCount}/{stats.totalCount}
              </p>
              <p className="text-sm text-neutral-600">badges débloqués</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-neutral-900">🔥 {stats.currentStreak} jours</p>
              <p className="text-xs text-neutral-500">Record : {stats.longestStreak} jours</p>
            </div>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2 mt-4">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${stats.totalCount > 0 ? (stats.unlockedCount / stats.totalCount) * 100 : 0}%` }}
            />
          </div>
        </Card>

        {/* Badges grid */}
        <div className="grid grid-cols-2 gap-3">
          {badges.map((badge) => (
            <Card
              key={badge.id}
              className={`text-center ${
                badge.unlocked
                  ? 'bg-white border-green-300'
                  : 'bg-neutral-100 border-neutral-200 opacity-60'
              }`}
            >
              <div
                className={`text-4xl mb-2 ${badge.unlocked ? '' : 'grayscale'}`}
              >
                {badge.icon}
              </div>
              <h3 className={`font-bold text-sm ${badge.unlocked ? 'text-neutral-900' : 'text-neutral-500'}`}>
                {badge.name}
              </h3>
              {badge.unlocked && badge.unlockedAt ? (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Débloqué le {formatDate(badge.unlockedAt)}
                </p>
              ) : (
                <p className="text-xs text-neutral-400 mt-1">
                  {badge.criteriaValue} {CRITERIA_LABELS[badge.criteriaType] || badge.criteriaType}
                </p>
              )}
            </Card>
          ))}
        </div>

        {badges.length === 0 && (
          <div className="text-center py-12">
            <span className="text-5xl mb-4 block">🏆</span>
            <p className="text-neutral-600">Aucun badge disponible pour le moment</p>
          </div>
        )}

      </div>
    </AppLayout>
  )
}

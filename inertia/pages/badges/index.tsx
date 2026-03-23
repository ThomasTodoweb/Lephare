import { Head, Link } from '@inertiajs/react'
import { ChevronLeft } from 'lucide-react'
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
  streak_days: 'jours de série',
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
    <AppLayout>
      <Head title="Mes Badges - Le Phare" />

      <div className="pt-4 pb-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/profile" className="inline-flex items-center gap-1 text-[13px] text-text-secondary mb-3">
            <ChevronLeft className="w-4 h-4" />
            Profil
          </Link>
          <h1 className="text-[22px] font-bold text-text">Mes badges</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Collectionne les badges
          </p>
        </div>

        {/* Progress overview */}
        <Card variant="bordered" className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[28px] font-bold text-text">
                {stats.unlockedCount}<span className="text-[16px] text-text-muted font-normal">/{stats.totalCount}</span>
              </p>
              <p className="text-[13px] text-text-secondary">badges débloqués</p>
            </div>
            <div className="text-right">
              <p className="text-[15px] font-semibold text-text">{stats.currentStreak} jours</p>
              <p className="text-[12px] text-text-muted">Série en cours</p>
            </div>
          </div>
          <div className="w-full bg-bg-subtle rounded-full h-1.5 mt-4">
            <div
              className="bg-text rounded-full h-1.5 transition-all"
              style={{ width: `${stats.totalCount > 0 ? (stats.unlockedCount / stats.totalCount) * 100 : 0}%` }}
            />
          </div>
        </Card>

        {/* Badges grid */}
        <div className="grid grid-cols-2 gap-3">
          {badges.map((badge) => (
            <Card
              key={badge.id}
              variant={badge.unlocked ? 'default' : 'flat'}
              className={!badge.unlocked ? 'opacity-50' : ''}
            >
              <div className="text-center">
                <div className={`text-[32px] mb-2 ${badge.unlocked ? '' : 'grayscale'}`}>
                  {badge.icon}
                </div>
                <h3 className="text-[13px] font-semibold text-text">
                  {badge.name}
                </h3>
                {badge.unlocked && badge.unlockedAt ? (
                  <p className="text-[11px] text-emerald-600 mt-1">
                    Débloqué le {formatDate(badge.unlockedAt)}
                  </p>
                ) : (
                  <p className="text-[11px] text-text-muted mt-1">
                    {badge.criteriaValue} {CRITERIA_LABELS[badge.criteriaType] || badge.criteriaType}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>

        {badges.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[14px] text-text-secondary">Aucun badge disponible pour le moment</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

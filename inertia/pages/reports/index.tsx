import { Head, Link } from '@inertiajs/react'
import { AppLayout } from '~/components/layout'
import { Card } from '~/components/ui'

interface Report {
  id: number
  weekStartDate: string
  missionsCompleted: number
  tutorialsViewed: number
  streakAtEnd: number
  isRead: boolean
}

interface Props {
  reports: Report[]
  hasUnread: boolean
}

export default function ReportsIndex({ reports, hasUnread }: Props) {
  const formatWeekDate = (isoDate: string) => {
    const date = new Date(isoDate)
    const endDate = new Date(date)
    endDate.setDate(date.getDate() + 6)

    const formatDay = (d: Date) =>
      d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

    return `${formatDay(date)} - ${formatDay(endDate)}`
  }

  return (
    <AppLayout currentPage="profile">
      <Head title="Bilans Hebdo - Le Phare" />

      <div className="py-4">
        {/* Header */}
        <div className="mb-6">
          <Link href="/profile" className="text-primary text-sm mb-2 inline-block">
            ← Retour au profil
          </Link>
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Bilans Hebdo
          </h1>
          <p className="text-neutral-600 mt-1">
            Vos feedbacks personnalisés chaque semaine
          </p>
        </div>

        {hasUnread && (
          <Card className="mb-4 bg-primary/5 border-primary">
            <div className="flex items-center gap-2">
              <span className="text-xl">📬</span>
              <p className="text-primary font-medium">Vous avez un nouveau bilan à lire !</p>
            </div>
          </Card>
        )}

        {/* Reports list */}
        <div className="space-y-3">
          {reports.map((report) => (
            <Link key={report.id} href={`/reports/${report.id}`}>
              <Card className={`${!report.isRead ? 'bg-primary/5 border-primary' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📊</span>
                      <p className="font-bold text-neutral-900">
                        Semaine du {formatWeekDate(report.weekStartDate)}
                      </p>
                      {!report.isRead && (
                        <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                          Nouveau
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-neutral-600">
                      <span>✓ {report.missionsCompleted} missions</span>
                      <span>📚 {report.tutorialsViewed} tutos</span>
                      <span>🔥 {report.streakAtEnd} streak</span>
                    </div>
                  </div>
                  <span className="text-neutral-400">→</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {reports.length === 0 && (
          <div className="text-center py-12">
            <span className="text-5xl mb-4 block">📊</span>
            <p className="text-neutral-600 mb-2">Aucun bilan disponible pour le moment</p>
            <p className="text-sm text-neutral-400">
              Votre premier bilan arrivera dimanche prochain !
            </p>
          </div>
        )}

      </div>
    </AppLayout>
  )
}

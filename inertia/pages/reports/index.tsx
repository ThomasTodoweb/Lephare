import { Head, Link } from '@inertiajs/react'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'
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
    <AppLayout>
      <Head title="Bilans Hebdo - Le Phare" />

      <div className="pt-4 pb-8 animate-fade-up">
        {/* Header */}
        <div className="mb-6">
          <Link href="/profile" className="inline-flex items-center gap-1 text-[13px] text-text-secondary min-h-[44px] -ml-1 pl-1 pr-2">
            <ChevronLeft className="w-4 h-4" />
            Profil
          </Link>
          <h1 className="text-[22px] font-bold text-text tracking-tight">Bilans hebdo</h1>
          <p className="text-[14px] text-text-secondary mt-1 leading-relaxed">
            Tes feedbacks personnalises chaque semaine
          </p>
        </div>

        {hasUnread && (
          <Card variant="bordered" className="mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full shrink-0" />
              <p className="text-[13px] font-medium text-text">Tu as un nouveau bilan a lire</p>
            </div>
          </Card>
        )}

        {/* Reports list */}
        <div className="space-y-2.5">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/reports/${report.id}`}
              className="block active:scale-[0.98] transition-transform"
            >
              <Card variant="default" className="border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-text">
                        {formatWeekDate(report.weekStartDate)}
                      </p>
                      {!report.isRead && (
                        <span className="w-2 h-2 bg-primary rounded-full shrink-0" />
                      )}
                    </div>
                    <div className="flex gap-4 mt-1.5 text-[12px] text-text-muted">
                      <span>{report.missionsCompleted} missions</span>
                      <span>{report.tutorialsViewed} tutos</span>
                      <span>{report.streakAtEnd}j serie</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {reports.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-4 bg-bg-subtle rounded-2xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-[15px] font-semibold text-text mb-1">Aucun bilan disponible</p>
            <p className="text-[13px] text-text-muted leading-relaxed">
              Ton premier bilan arrivera dimanche prochain
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

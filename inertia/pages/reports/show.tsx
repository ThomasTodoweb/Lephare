import { Head, Link } from '@inertiajs/react'
import { ChevronLeft, ArrowRight } from 'lucide-react'
import { AppLayout } from '~/components/layout'
import { Card } from '~/components/ui'

interface Report {
  id: number
  weekStartDate: string
  content: string
  missionsCompleted: number
  tutorialsViewed: number
  streakAtEnd: number
}

interface Props {
  report: Report
}

export default function ReportShow({ report }: Props) {
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
      <Head title="Bilan Hebdo - Le Phare" />

      <div className="pt-4 pb-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/reports" className="inline-flex items-center gap-1 text-[13px] text-text-secondary min-h-[44px] -ml-1 pl-1 pr-2">
            <ChevronLeft className="w-4 h-4" />
            Bilans
          </Link>
          <h1 className="text-[22px] font-bold text-text tracking-tight">Bilan hebdo</h1>
          <p className="text-[14px] text-text-secondary mt-1 leading-relaxed">
            Semaine du {formatWeekDate(report.weekStartDate)}
          </p>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <Card className="text-center shadow-xs">
            <p className="text-[22px] font-bold text-text tabular-nums">{report.missionsCompleted}</p>
            <p className="text-[11px] text-text-muted">missions</p>
          </Card>
          <Card className="text-center shadow-xs">
            <p className="text-[22px] font-bold text-text tabular-nums">{report.tutorialsViewed}</p>
            <p className="text-[11px] text-text-muted">tutoriels</p>
          </Card>
          <Card className="text-center shadow-xs">
            <p className="text-[22px] font-bold text-text tabular-nums">{report.streakAtEnd}</p>
            <p className="text-[11px] text-text-muted">serie</p>
          </Card>
        </div>

        {/* AI content */}
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Feedback personnalise</p>
        <Card variant="flat" className="mb-6">
          <p className="text-[14px] text-text-secondary whitespace-pre-line leading-relaxed">
            {report.content}
          </p>
        </Card>

        {/* Motivation */}
        <Card variant="flat" className="text-center">
          <p className="text-[14px] font-semibold text-text mb-2">
            Cette semaine, tu peux faire encore mieux
          </p>
          <Link
            href="/missions"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-secondary min-h-[44px] active:scale-[0.97] transition-transform"
          >
            Voir ma mission du jour
            <ArrowRight size={14} />
          </Link>
        </Card>
      </div>
    </AppLayout>
  )
}

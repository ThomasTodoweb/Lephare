import { Head, Link } from '@inertiajs/react'
import { ChevronLeft } from 'lucide-react'
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
          <Link href="/reports" className="inline-flex items-center gap-1 text-[13px] text-text-secondary mb-3">
            <ChevronLeft className="w-4 h-4" />
            Bilans
          </Link>
          <h1 className="text-[22px] font-bold text-text">Bilan hebdo</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Semaine du {formatWeekDate(report.weekStartDate)}
          </p>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <Card className="text-center">
            <p className="text-[22px] font-bold text-text">{report.missionsCompleted}</p>
            <p className="text-[11px] text-text-muted">missions</p>
          </Card>
          <Card className="text-center">
            <p className="text-[22px] font-bold text-text">{report.tutorialsViewed}</p>
            <p className="text-[11px] text-text-muted">tutoriels</p>
          </Card>
          <Card className="text-center">
            <p className="text-[22px] font-bold text-text">{report.streakAtEnd}</p>
            <p className="text-[11px] text-text-muted">série</p>
          </Card>
        </div>

        {/* AI content */}
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Feedback personnalisé</p>
        <Card variant="flat" className="mb-6">
          <p className="text-[14px] text-text-secondary whitespace-pre-line leading-relaxed">
            {report.content}
          </p>
        </Card>

        {/* Motivation */}
        <Card variant="flat" className="text-center">
          <p className="text-[14px] font-semibold text-text">
            Cette semaine, tu peux faire encore mieux
          </p>
          <Link href="/missions" className="text-[13px] text-text-secondary underline mt-1 inline-block">
            Voir ma mission du jour
          </Link>
        </Card>
      </div>
    </AppLayout>
  )
}

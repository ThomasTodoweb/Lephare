import { Head, Link } from '@inertiajs/react'
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
    <AppLayout currentPage="profile">
      <Head title="Bilan Hebdo - Le Phare" />

      <div className="py-4">
        {/* Header */}
        <div className="mb-6">
          <Link href="/reports" className="text-primary text-sm mb-2 inline-block">
            ← Retour aux bilans
          </Link>
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Bilan Hebdo
          </h1>
          <p className="text-neutral-600 mt-1">
            Semaine du {formatWeekDate(report.weekStartDate)}
          </p>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="text-center">
            <span className="text-2xl block mb-1">✓</span>
            <p className="text-2xl font-bold text-neutral-900">{report.missionsCompleted}</p>
            <p className="text-xs text-neutral-500">missions</p>
          </Card>
          <Card className="text-center">
            <span className="text-2xl block mb-1">📚</span>
            <p className="text-2xl font-bold text-neutral-900">{report.tutorialsViewed}</p>
            <p className="text-xs text-neutral-500">tutoriels</p>
          </Card>
          <Card className="text-center">
            <span className="text-2xl block mb-1">🔥</span>
            <p className="text-2xl font-bold text-neutral-900">{report.streakAtEnd}</p>
            <p className="text-xs text-neutral-500">streak</p>
          </Card>
        </div>

        {/* AI content */}
        <Card className="mb-6 bg-neutral-50">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-3xl">🤖</span>
            <div>
              <p className="font-bold text-neutral-900">Votre coach IA</p>
              <p className="text-xs text-neutral-500">Feedback personnalisé</p>
            </div>
          </div>
          <div className="pl-12">
            <p className="text-neutral-700 whitespace-pre-line leading-relaxed">
              {report.content}
            </p>
          </div>
        </Card>

        {/* Motivation */}
        <Card className="text-center bg-primary/5 border-primary">
          <span className="text-4xl block mb-2">💪</span>
          <p className="font-bold text-primary">
            Cette semaine, vous pouvez faire encore mieux !
          </p>
          <Link href="/missions" className="text-sm text-primary underline mt-2 inline-block">
            Voir ma mission du jour →
          </Link>
        </Card>

      </div>
    </AppLayout>
  )
}

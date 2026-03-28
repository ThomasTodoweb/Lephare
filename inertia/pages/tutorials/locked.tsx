import { Head, Link } from '@inertiajs/react'
import { Lock } from 'lucide-react'
import { AppLayout } from '~/components/layout'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'

interface Props {
  tutorial: {
    id: number
    title: string
    requiredLevel: number
  }
  userLevel: number
}

export default function TutorialLocked({ tutorial, userLevel }: Props) {
  return (
    <AppLayout>
      <Head title={`${tutorial.title} - Verrouille`} />

      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        {/* Lock icon */}
        <div className="w-16 h-16 bg-bg-subtle rounded-2xl flex items-center justify-center mb-6">
          <Lock className="w-7 h-7 text-text-muted" />
        </div>

        {/* Title */}
        <h1 className="text-[18px] font-bold text-text mb-1 tracking-tight">{tutorial.title}</h1>
        <p className="text-[14px] text-text-secondary mb-6 leading-relaxed">Ce tutoriel est verrouille</p>

        {/* Level comparison */}
        <Card variant="bordered" className="w-full max-w-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Ton niveau</p>
              <span className="text-[24px] font-bold text-text">{userLevel}</span>
            </div>
            <div className="text-text-muted text-[20px]">&rarr;</div>
            <div className="text-center">
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Requis</p>
              <span className="text-[24px] font-bold text-text">{tutorial.requiredLevel}</span>
            </div>
          </div>
          <div className="w-full bg-bg-subtle rounded-full h-1.5">
            <div
              className="bg-text rounded-full h-1.5 transition-all"
              style={{ width: `${Math.min(100, (userLevel / tutorial.requiredLevel) * 100)}%` }}
            />
          </div>
          <p className="text-[12px] text-text-muted mt-2 leading-relaxed">
            Encore {tutorial.requiredLevel - userLevel} niveau{tutorial.requiredLevel - userLevel > 1 ? 'x' : ''} pour debloquer
          </p>
        </Card>

        {/* Tips */}
        <Card variant="flat" className="w-full max-w-sm mb-6 text-left">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Comment gagner des points ?</p>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-md bg-bg-inset flex items-center justify-center text-[11px] text-text-secondary font-semibold shrink-0 mt-0.5">1</span>
              <span className="text-[13px] text-text-secondary leading-relaxed">Complete tes missions quotidiennes</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-md bg-bg-inset flex items-center justify-center text-[11px] text-text-secondary font-semibold shrink-0 mt-0.5">2</span>
              <span className="text-[13px] text-text-secondary leading-relaxed">Regarde les tutoriels disponibles</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-md bg-bg-inset flex items-center justify-center text-[11px] text-text-secondary font-semibold shrink-0 mt-0.5">3</span>
              <span className="text-[13px] text-text-secondary leading-relaxed">Maintiens ta serie active</span>
            </li>
          </ul>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Link href="/tutorials" className="block">
            <Button fullWidth>
              Voir les tutoriels disponibles
            </Button>
          </Link>
          <Link href="/dashboard" className="block">
            <Button variant="secondary" fullWidth>
              Retour a l'accueil
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  )
}

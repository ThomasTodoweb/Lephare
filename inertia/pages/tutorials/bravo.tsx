import { Head, Link } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'

interface Props {
  tutorial: {
    id: number
    title: string
  }
}

export default function TutorialBravo({ tutorial }: Props) {
  return (
    <>
      <Head title="Bravo ! - Le Phare" />
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
        {/* Celebration */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <span className="text-emerald-600 text-[28px] font-bold">✓</span>
          </div>
          <h1 className="text-[22px] font-bold text-text mb-2">
            Bravo !
          </h1>
          <p className="text-[15px] text-text-secondary">
            Tu viens d'apprendre un nouveau trick !
          </p>
        </div>

        {/* Tutorial completed info */}
        <Card variant="bordered" className="w-full max-w-xs mb-8 text-center">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Tutoriel terminé</p>
          <p className="text-[14px] text-text font-medium">{tutorial.title}</p>
        </Card>

        {/* Message */}
        <p className="text-[14px] text-text-secondary text-center mb-8 max-w-xs leading-relaxed">
          Continue ton apprentissage pour devenir un pro de la communication Instagram.
        </p>

        {/* Action buttons */}
        <div className="w-full max-w-xs space-y-3">
          <Link href="/missions" className="block">
            <Button fullWidth>
              Retour aux missions
            </Button>
          </Link>
          <Link href="/tutorials" className="block">
            <Button variant="secondary" fullWidth>
              Voir d'autres tutoriels
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}

import { Head, Link } from '@inertiajs/react'
import { Check } from 'lucide-react'
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
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5">
        {/* Celebration — entry animations with stagger */}
        <div className="text-center mb-8 animate-fade-up" style={{ animationDelay: '0ms' }}>
          <div className="w-16 h-16 bg-success/10 border border-success/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Check size={28} className="text-success" strokeWidth={2.5} />
          </div>
          <h1 className="text-[22px] font-bold text-text mb-2 tracking-tight">
            Bravo !
          </h1>
          <p className="text-[15px] text-text-secondary leading-relaxed">
            Tu viens d'apprendre un nouveau trick !
          </p>
        </div>

        {/* Tutorial completed info */}
        <div className="w-full max-w-xs mb-8 animate-fade-up" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
          <Card variant="bordered" className="text-center">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Tutoriel termine</p>
            <p className="text-[14px] text-text font-medium">{tutorial.title}</p>
          </Card>
        </div>

        {/* Message */}
        <p
          className="text-[14px] text-text-secondary text-center mb-8 max-w-xs leading-relaxed animate-fade-up"
          style={{ animationDelay: '160ms', animationFillMode: 'both' }}
        >
          Continue ton apprentissage pour devenir un pro de la communication Instagram.
        </p>

        {/* Action buttons */}
        <div
          className="w-full max-w-xs space-y-3 animate-fade-up"
          style={{ animationDelay: '240ms', animationFillMode: 'both' }}
        >
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

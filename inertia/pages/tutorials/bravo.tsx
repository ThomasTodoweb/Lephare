import { Head, Link } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        {/* Celebration animation */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 animate-bounce">🎓</div>
          <h1 className="text-3xl font-extrabold text-neutral-900 uppercase tracking-tight mb-2">
            Bravo !
          </h1>
          <p className="text-xl text-primary font-bold">
            Vous avez appris quelque chose de nouveau !
          </p>
        </div>

        {/* Tutorial completed info */}
        <div className="w-full max-w-xs mb-8 bg-white rounded-2xl border-4 border-green-400 p-6 text-center">
          <span className="text-4xl mb-2 block">✓</span>
          <h2 className="font-bold text-neutral-900 mb-1">Tutoriel terminé</h2>
          <p className="text-neutral-600 text-sm">{tutorial.title}</p>
        </div>


        {/* Message */}
        <p className="text-neutral-600 text-center mb-8 max-w-xs">
          Mission accomplie ! Continuez votre apprentissage pour devenir un pro de la communication Instagram.
        </p>

        {/* Action buttons */}
        <div className="w-full max-w-xs space-y-3">
          <Link href="/missions" className="block">
            <Button className="w-full">
              Retour aux missions
            </Button>
          </Link>
          <Link href="/tutorials" className="block">
            <Button variant="outlined" className="w-full">
              Voir d'autres tutoriels
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}

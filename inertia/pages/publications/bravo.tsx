import { Head, Link } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'

interface Props {
  publication: {
    id: number
    imagePath: string
  }
}

export default function Bravo({ publication }: Props) {
  return (
    <>
      <Head title="Bravo ! - Le Phare" />
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        {/* Celebration animation placeholder */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 animate-bounce">🎉</div>
          <h1 className="text-3xl font-extrabold text-neutral-900 uppercase tracking-tight mb-2">
            Bravo !
          </h1>
          <p className="text-xl text-primary font-bold">
            Vous êtes stylé !
          </p>
        </div>

        {/* Photo preview */}
        <div className="w-48 h-48 mb-8">
          <img
            src={`/${publication.imagePath}`}
            alt="Votre publication"
            className="w-full h-full object-cover rounded-2xl border-4 border-primary shadow-lg"
          />
        </div>


        {/* Message */}
        <p className="text-neutral-600 text-center mb-8 max-w-xs">
          Votre contenu a été publié sur Instagram. Continuez comme ça pour développer votre communauté !
        </p>

        {/* Action buttons */}
        <div className="w-full max-w-xs space-y-3">
          <Link href="/missions" className="block">
            <Button className="w-full">
              Retour aux missions
            </Button>
          </Link>
          <Link href="/dashboard" className="block">
            <Button variant="outlined" className="w-full">
              Voir le dashboard
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}

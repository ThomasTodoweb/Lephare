import { Head, Link } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { CheckCircle } from 'lucide-react'

interface Props {
  publication: {
    id: number
    imagePath: string
  }
}

export default function Bravo({ publication }: Props) {
  return (
    <>
      <Head title="Publication réussie - Le Phare" />
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        {/* Success icon */}
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-emerald-500" strokeWidth={1.5} />
        </div>

        {/* Title */}
        <h1 className="text-xl font-semibold text-neutral-900 mb-2">
          Publication réussie
        </h1>

        {/* Photo preview */}
        <div className="w-32 h-32 my-6">
          <img
            src={`/${publication.imagePath}`}
            alt="Votre publication"
            className="w-full h-full object-cover rounded-lg border border-neutral-200"
          />
        </div>

        {/* Message */}
        <p className="text-sm text-neutral-500 text-center mb-8 max-w-xs">
          Votre contenu est maintenant visible sur Instagram.
        </p>

        {/* Action buttons */}
        <div className="w-full max-w-xs space-y-4">
          <Link href="/missions" className="block">
            <Button className="w-full">
              Retour aux missions
            </Button>
          </Link>
          <Link href="/dashboard" className="block text-center text-sm text-neutral-500 hover:text-neutral-700">
            Voir le dashboard
          </Link>
        </div>
      </div>
    </>
  )
}

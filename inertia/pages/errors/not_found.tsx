import { Head, Link } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <>
      <Head title="Page introuvable - Le Phare" />
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5 py-12">
        <div className="text-center max-w-sm">
          <p className="text-[64px] font-bold text-text leading-none tracking-tight">404</p>
          <h1 className="text-[22px] font-bold text-text mt-4 tracking-tight">
            Page introuvable
          </h1>
          <p className="text-[14px] text-text-secondary mt-2 leading-relaxed">
            Cette page n'existe pas ou a ete deplacee. Retourne a l'accueil pour continuer.
          </p>
          <div className="mt-8">
            <Link href="/dashboard">
              <Button icon={ArrowLeft}>
                Retour au tableau de bord
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

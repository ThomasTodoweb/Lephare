import { Head, Link } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { ArrowLeft } from 'lucide-react'

export default function ServerError(props: { error: any }) {
  return (
    <>
      <Head title="Erreur serveur - Le Phare" />
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5 py-12">
        <div className="text-center max-w-sm">
          <p className="text-[64px] font-bold text-text leading-none">500</p>
          <h1 className="text-[22px] font-bold text-text mt-4 tracking-tight">
            Erreur serveur
          </h1>
          <p className="text-[14px] text-text-secondary mt-2 leading-relaxed">
            {props.error.message || 'Oups, quelque chose a planté. Réessaie dans quelques minutes.'}
          </p>
          <div className="mt-8">
            <Link href="/dashboard">
              <Button variant="primary" icon={ArrowLeft}>
                Retour au tableau de bord
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

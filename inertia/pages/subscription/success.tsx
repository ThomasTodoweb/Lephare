import { Head, Link } from '@inertiajs/react'
import { AppLayout } from '~/components/layout'
import { Button, Card } from '~/components/ui'

export default function SubscriptionSuccess() {
  return (
    <AppLayout>
      <Head title="Abonnement activé - Le Phare" />

      <div className="py-4">
        <div className="text-center py-12">
          {/* Success Icon */}
          <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
            <span className="text-5xl">🎉</span>
          </div>

          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight mb-4">
            Bienvenue !
          </h1>

          <p className="text-neutral-600 mb-8 max-w-sm mx-auto">
            Votre abonnement est maintenant actif. Vous avez accès à toutes les fonctionnalités de Le Phare !
          </p>

          <Card className="mb-6 text-left">
            <h2 className="font-bold text-lg text-neutral-900 mb-4">Prochaines étapes</h2>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <span className="text-neutral-700">Découvrez votre mission du jour</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <span className="text-neutral-700">Explorez les tutoriels</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  3
                </span>
                <span className="text-neutral-700">Activez les rappels quotidiens</span>
              </li>
            </ul>
          </Card>

          <div className="space-y-3">
            <Link href="/missions">
              <Button className="w-full">Voir ma mission du jour</Button>
            </Link>
            <Link href="/profile">
              <Button variant="outlined" className="w-full">
                Retour au profil
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}

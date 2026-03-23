import { Head, Link } from '@inertiajs/react'
import { AppLayout } from '~/components/layout'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { Check } from 'lucide-react'

export default function SubscriptionSuccess() {
  return (
    <AppLayout>
      <Head title="Abonnement activé - Le Phare" />

      <div className="py-4">
        <div className="text-center py-12">
          {/* Success Icon */}
          <div className="w-16 h-16 mx-auto bg-green-50 rounded-2xl flex items-center justify-center mb-5">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Check size={22} className="text-white" />
            </div>
          </div>

          <h1 className="text-[22px] font-bold text-text mb-2">
            Bienvenue !
          </h1>

          <p className="text-[14px] text-text-secondary mb-8 max-w-sm mx-auto">
            Votre abonnement est maintenant actif. Vous avez accès à toutes les fonctionnalités de Le Phare !
          </p>

          <Card variant="bordered" className="mb-6 text-left">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-4">
              Prochaines étapes
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-text text-white flex items-center justify-center text-[12px] font-semibold flex-shrink-0">
                  1
                </span>
                <span className="text-[14px] text-text">Découvrez votre mission du jour</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-text text-white flex items-center justify-center text-[12px] font-semibold flex-shrink-0">
                  2
                </span>
                <span className="text-[14px] text-text">Explorez les tutoriels</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-text text-white flex items-center justify-center text-[12px] font-semibold flex-shrink-0">
                  3
                </span>
                <span className="text-[14px] text-text">Activez les rappels quotidiens</span>
              </li>
            </ul>
          </Card>

          <div className="space-y-3">
            <Link href="/missions">
              <Button fullWidth>Voir ma mission du jour</Button>
            </Link>
            <Link href="/profile">
              <Button variant="secondary" fullWidth>
                Retour au profil
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

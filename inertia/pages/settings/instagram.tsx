import { Head, Link, useForm } from '@inertiajs/react'
import { Card } from '~/components/ui/Card'
import { Button } from '~/components/ui/Button'
import { ArrowLeft, Check } from 'lucide-react'

interface Props {
  isConfigured: boolean
  account: {
    username: string
    profilePictureUrl: string | null
    status: string
  } | null
}

export default function InstagramSettings({ isConfigured, account }: Props) {
  const disconnectForm = useForm({})

  const handleConnect = () => {
    window.location.href = '/instagram/connect'
  }

  const handleDisconnect = () => {
    if (confirm('Etes-vous sur de vouloir deconnecter votre compte Instagram ?')) {
      disconnectForm.post('/instagram/disconnect')
    }
  }

  const handleManageOnLate = () => {
    window.open('https://getlate.dev/dashboard', '_blank')
  }

  return (
    <>
      <Head title="Instagram - Parametres - Le Phare" />
      <div className="min-h-screen bg-bg">
        {/* Header */}
        <div className="px-5 pt-14 pb-4">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text transition-colors mb-4"
          >
            <ArrowLeft size={15} />
            <span>Retour</span>
          </Link>
          <h1 className="text-[22px] font-semibold text-text">Instagram</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Connectez votre compte Instagram pour publier directement depuis Le Phare
          </p>
        </div>

        {/* Content */}
        <div className="px-5 pt-4 pb-32 space-y-4">
          {!isConfigured ? (
            <Card variant="bordered" className="text-center py-10">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                </svg>
              </div>
              <h2 className="text-[17px] font-semibold text-text mb-2">
                Configuration requise
              </h2>
              <p className="text-[14px] text-text-secondary max-w-sm mx-auto">
                La connexion Instagram n'est pas encore configuree. Contactez l'administrateur pour activer cette fonctionnalite.
              </p>
            </Card>
          ) : account ? (
            <>
              {/* Connected account */}
              <Card variant="bordered">
                <div className="flex items-center gap-3">
                  {account.profilePictureUrl ? (
                    <img
                      src={account.profilePictureUrl}
                      alt={account.username}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold text-text">
                      @{account.username}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          account.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                      />
                      <span className="text-[12px] text-text-muted">
                        {account.status === 'active' ? 'Connecte' : 'Connexion requise'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Status info */}
              <Card variant="bordered" className="bg-green-50/50">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={12} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-green-800">Compte connecte</p>
                    <p className="text-[13px] text-green-700 mt-0.5">
                      Vous pouvez publier sur Instagram directement depuis vos missions quotidiennes.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <Link href="/missions">
                  <Button fullWidth>
                    Voir mes missions
                  </Button>
                </Link>
                <Button
                  onClick={handleDisconnect}
                  variant="danger"
                  loading={disconnectForm.processing}
                  fullWidth
                >
                  Deconnecter Instagram
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Not connected */}
              <Card variant="bordered" className="text-center py-10">
                <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                  </svg>
                </div>
                <h2 className="text-[17px] font-semibold text-text mb-2">
                  Connectez Instagram
                </h2>
                <p className="text-[14px] text-text-secondary mb-6 max-w-sm mx-auto">
                  Liez votre compte Instagram pour publier vos photos directement depuis Le Phare.
                </p>
                <div className="max-w-xs mx-auto">
                  <Button onClick={handleConnect} fullWidth>
                    Connecter Instagram
                  </Button>
                </div>
              </Card>

              {/* Benefits */}
              <Card variant="bordered">
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-4">
                  Avantages
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-text flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={12} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-text">Publication en un clic</p>
                      <p className="text-[13px] text-text-muted">
                        Publiez directement apres avoir pris votre photo
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-text flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={12} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-text">Legendes generees par IA</p>
                      <p className="text-[13px] text-text-muted">
                        Des descriptions optimisees pour votre restaurant
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-text flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={12} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-text">Suivi des publications</p>
                      <p className="text-[13px] text-text-muted">
                        Historique et statistiques de vos posts
                      </p>
                    </div>
                  </li>
                </ul>
              </Card>

              {/* Security info */}
              <Card variant="bordered" className="bg-bg-subtle">
                <div className="flex items-start gap-3">
                  <span className="text-[15px] mt-0.5">🔒</span>
                  <div>
                    <p className="text-[14px] font-medium text-text">Securise par Late</p>
                    <p className="text-[13px] text-text-muted mt-0.5">
                      La connexion est geree par Late, un service certifie par Meta. Vos identifiants ne sont jamais stockes sur nos serveurs.
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  )
}

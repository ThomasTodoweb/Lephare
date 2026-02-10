import { Head, Link, useForm } from '@inertiajs/react'
import { Card } from '~/components/ui/Card'
import { Button } from '~/components/ui/Button'

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
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="px-6 pt-14 pb-6">
          <Link
            href="/profile"
            className="inline-flex items-center text-neutral-500 hover:text-neutral-700 mb-4"
          >
            <span className="mr-2">←</span> Retour
          </Link>
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Instagram
          </h1>
          <p className="text-neutral-500 mt-1">
            Connectez votre compte Instagram pour publier directement depuis Le Phare
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pt-6 pb-32 space-y-6">
          {!isConfigured ? (
            <Card className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-neutral-900 mb-2">
                Configuration requise
              </h2>
              <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
                La connexion Instagram n'est pas encore configuree. Contactez l'administrateur pour activer cette fonctionnalite.
              </p>
            </Card>
          ) : account ? (
            <>
              {/* Connected account */}
              <Card>
                <div className="flex items-center gap-4">
                  {account.profilePictureUrl ? (
                    <img
                      src={account.profilePictureUrl}
                      alt={account.username}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-neutral-900">
                      @{account.username}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          account.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                      />
                      <span className="text-sm text-neutral-500">
                        {account.status === 'active' ? 'Connecte' : 'Connexion requise'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Status info */}
              <Card className="bg-green-50 border-green-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <div>
                    <h3 className="font-bold text-green-800">Compte connecte</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Vous pouvez publier sur Instagram directement depuis vos missions quotidiennes.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <div className="space-y-3">
                <Link href="/missions">
                  <Button className="w-full">
                    Voir mes missions
                  </Button>
                </Link>
                <Button
                  onClick={handleDisconnect}
                  variant="outlined"
                  disabled={disconnectForm.processing}
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  {disconnectForm.processing ? 'Deconnexion...' : 'Deconnecter Instagram'}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Not connected */}
              <Card className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-neutral-900 mb-2">
                  Connectez Instagram
                </h2>
                <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
                  Liez votre compte Instagram pour publier vos photos directement depuis Le Phare.
                </p>
                <a
                  href="/instagram/connect"
                  className="block w-full max-w-xs mx-auto px-6 py-3 bg-primary text-white text-center font-bold uppercase tracking-wide rounded-full hover:bg-primary-dark transition-colors min-h-[44px]"
                >
                  Connecter Instagram
                </a>
              </Card>

              {/* Benefits */}
              <Card>
                <h3 className="font-bold text-neutral-900 mb-4">Avantages</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-primary">✓</span>
                    <div>
                      <p className="font-medium">Publication en un clic</p>
                      <p className="text-sm text-neutral-500">
                        Publiez directement apres avoir pris votre photo
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary">✓</span>
                    <div>
                      <p className="font-medium">Legendes generees par IA</p>
                      <p className="text-sm text-neutral-500">
                        Des descriptions optimisees pour votre restaurant
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary">✓</span>
                    <div>
                      <p className="font-medium">Suivi des publications</p>
                      <p className="text-sm text-neutral-500">
                        Historique et statistiques de vos posts
                      </p>
                    </div>
                  </li>
                </ul>
              </Card>

              {/* Security info */}
              <Card className="bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <h3 className="font-bold text-blue-800">Securise par Late</h3>
                    <p className="text-sm text-blue-700 mt-1">
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

import { Head, useForm } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { RHYTHM_LABELS, TYPE_LABELS } from '~/lib/constants'

interface Props {
  user: {
    email: string
    createdAt: string
  }
  restaurant: {
    name: string
    type: string
    publicationRhythm: string | null
  } | null
  instagram: {
    username: string
    connectedAt: string
  } | null
}

export default function Profile({ user, restaurant, instagram }: Props) {
  const disconnectForm = useForm({})
  const reconnectForm = useForm({})
  const logoutForm = useForm({})

  const handleDisconnectInstagram = () => {
    if (confirm('Voulez-vous vraiment déconnecter votre compte Instagram ?')) {
      disconnectForm.post('/profile/instagram/disconnect')
    }
  }

  const handleReconnectInstagram = () => {
    reconnectForm.get('/profile/instagram/reconnect')
  }

  const handleLogout = () => {
    logoutForm.post('/logout')
  }

  return (
    <>
      <Head title="Mon profil - Le Phare" />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Mon profil
          </h1>
        </div>

        {/* Content */}
        <div className="px-6 pb-32 space-y-6">
          {/* Account info */}
          <Card>
            <h2 className="font-bold text-lg text-neutral-900 mb-4">Compte</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Membre depuis</span>
                <span className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </Card>

          {/* Restaurant info */}
          {restaurant && (
            <Card>
              <h2 className="font-bold text-lg text-neutral-900 mb-4">Mon restaurant</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Nom</span>
                  <span className="font-medium">{restaurant.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Type</span>
                  <span className="font-medium">{TYPE_LABELS[restaurant.type] || restaurant.type}</span>
                </div>
                {restaurant.publicationRhythm && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Rythme de publication</span>
                    <span className="font-medium">
                      {RHYTHM_LABELS[restaurant.publicationRhythm] || restaurant.publicationRhythm}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Instagram connection */}
          <Card>
            <h2 className="font-bold text-lg text-neutral-900 mb-4">Instagram</h2>
            {instagram ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">@{instagram.username}</p>
                    <p className="text-sm text-neutral-500">
                      Connecté le {new Date(instagram.connectedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outlined"
                    onClick={handleReconnectInstagram}
                    disabled={reconnectForm.processing}
                    className="flex-1"
                  >
                    Reconnecter
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleDisconnectInstagram}
                    disabled={disconnectForm.processing}
                    className="flex-1 !border-red-500 !text-red-500"
                  >
                    Déconnecter
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-neutral-600 text-sm">
                  Aucun compte Instagram connecté
                </p>
                <Button
                  onClick={handleReconnectInstagram}
                  disabled={reconnectForm.processing}
                  className="w-full"
                >
                  Connecter Instagram
                </Button>
              </div>
            )}
          </Card>

          {/* Logout */}
          <Button
            variant="outlined"
            onClick={handleLogout}
            disabled={logoutForm.processing}
            className="w-full"
          >
            Déconnexion
          </Button>
        </div>
      </div>
    </>
  )
}

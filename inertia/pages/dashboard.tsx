import { Head, router, usePage } from '@inertiajs/react'
import { AppLayout } from '~/components/layout'
import { Button, Card } from '~/components/ui'

interface Props {
  user: { id: number; email: string; fullName?: string }
  restaurant: { name: string; type: string }
  flash?: {
    success?: string
  }
}

export default function Dashboard({ user, restaurant }: Props) {
  const { flash } = usePage<{ flash?: { success?: string } }>().props

  function handleLogout() {
    router.post('/logout')
  }

  return (
    <AppLayout currentPage="home">
      <Head title="Accueil" />

      {flash?.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-4">
          {flash.success}
        </div>
      )}

      <div className="text-center py-8">
        <h1 className="text-2xl font-bold uppercase mb-2">
          Bienvenue {user.fullName || 'Chef'} !
        </h1>
        <p className="text-gray-600 mb-6">{restaurant.name}</p>

        <Card className="mb-6">
          <p className="text-sm text-gray-500 mb-4">
            Votre mission du jour arrive bientôt...
          </p>
          <p className="text-xs text-gray-400">
            (Epic 3 - Onboarding & Strategies)
          </p>
        </Card>

        <Button variant="outlined" onClick={handleLogout}>
          Déconnexion
        </Button>
      </div>
    </AppLayout>
  )
}

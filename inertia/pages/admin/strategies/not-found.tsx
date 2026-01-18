import { Head, Link } from '@inertiajs/react'
import { AdminLayout } from '~/components/layout'
import { Card, Button } from '~/components/ui'

export default function AdminStrategyNotFound() {
  return (
    <AdminLayout title="Stratégie non trouvée">
      <Head title="Stratégie non trouvée - Admin Le Phare" />

      <Card className="text-center py-12">
        <span className="text-6xl block mb-4">🎯</span>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Stratégie introuvable</h2>
        <p className="text-neutral-500 mb-6">
          La stratégie que vous recherchez n'existe pas ou a été supprimée.
        </p>
        <Link href="/admin/strategies">
          <Button>Retour aux stratégies</Button>
        </Link>
      </Card>
    </AdminLayout>
  )
}

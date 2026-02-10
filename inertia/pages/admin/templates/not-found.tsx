import { Head, Link } from '@inertiajs/react'
import { AdminLayout } from '~/components/layout'
import { Card, Button } from '~/components/ui'

export default function AdminTemplateNotFound() {
  return (
    <AdminLayout title="Mission non trouvée">
      <Head title="Mission non trouvée - Admin Le Phare" />

      <Card className="text-center py-12">
        <span className="text-6xl block mb-4">📝</span>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Mission introuvable</h2>
        <p className="text-neutral-500 mb-6">
          La mission que vous recherchez n'existe pas ou a été supprimée.
        </p>
        <Link href="/admin/templates">
          <Button>Retour aux missions</Button>
        </Link>
      </Card>
    </AdminLayout>
  )
}

import { Head, Link } from '@inertiajs/react'
import { AdminLayout } from '~/components/layout'
import { Card, Button } from '~/components/ui'

export default function AdminTutorialNotFound() {
  return (
    <AdminLayout title="Tutoriel non trouvé">
      <Head title="Tutoriel non trouvé - Admin Le Phare" />

      <Card className="text-center py-12">
        <span className="text-6xl block mb-4">📚</span>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Tutoriel introuvable</h2>
        <p className="text-neutral-500 mb-6">
          Le tutoriel que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <Link href="/admin/tutorials">
          <Button>Retour aux tutoriels</Button>
        </Link>
      </Card>
    </AdminLayout>
  )
}

import { Head, Link } from '@inertiajs/react'
import { AdminLayout } from '~/components/layout'
import { Card, Button } from '~/components/ui'
import { SearchX } from 'lucide-react'

export default function AdminTemplateNotFound() {
  return (
    <AdminLayout title="Mission non trouvée">
      <Head title="Mission non trouvée - Admin Le Phare" />

      <Card className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
          <SearchX size={28} className="text-neutral-400" />
        </div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Mission introuvable</h2>
        <p className="text-[13px] text-neutral-500 mb-6">
          La mission que vous recherchez n'existe pas ou a été supprimée.
        </p>
        <Link href="/admin/templates">
          <Button>Retour aux missions</Button>
        </Link>
      </Card>
    </AdminLayout>
  )
}

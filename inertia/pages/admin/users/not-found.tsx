import { Head, Link } from '@inertiajs/react'
import { AdminLayout } from '~/components/layout'
import { Card, Button } from '~/components/ui'
import { SearchX } from 'lucide-react'

export default function AdminUserNotFound() {
  return (
    <AdminLayout title="Utilisateur non trouvé">
      <Head title="Utilisateur non trouvé - Admin Le Phare" />

      <Card className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
          <SearchX size={28} className="text-neutral-400" />
        </div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Utilisateur introuvable</h2>
        <p className="text-[13px] text-neutral-500 mb-6">
          L'utilisateur que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <Link href="/admin/users">
          <Button>Retour à la liste</Button>
        </Link>
      </Card>
    </AdminLayout>
  )
}

import { Head, Link } from '@inertiajs/react'
import { AppLayout } from '~/components/layout'
import { Card } from '~/components/ui'
import { Bell, ArrowLeft } from 'lucide-react'

export default function Notifications() {
  return (
    <AppLayout>
      <Head title="Notifications" />

      <div className="py-4">
        {/* Header with back button */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/dashboard"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </Link>
          <h1 className="text-xl font-bold text-neutral-900">Notifications</h1>
        </div>

        {/* Empty state */}
        <Card className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
            <Bell className="w-8 h-8 text-neutral-400" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">
            Aucune notification
          </h2>
          <p className="text-neutral-600 text-sm max-w-xs mx-auto">
            Tu n'as pas encore de notifications. Elles apparaitront ici quand tu en recevras !
          </p>
        </Card>
      </div>
    </AppLayout>
  )
}

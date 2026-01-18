import { Head, Link, useForm } from '@inertiajs/react'
import { AdminLayout } from '~/components/layout'
import { Card, Button, Input } from '~/components/ui'

export default function AdminStrategiesCreate() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    slug: '',
    description: '',
    icon: '🎯',
    isActive: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/admin/strategies')
  }

  const generateSlug = () => {
    const slug = data.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    setData('slug', slug)
  }

  const commonIcons = ['🎯', '🚀', '📢', '🎓', '💡', '⭐', '🔥', '💪', '📈', '🎨']

  return (
    <AdminLayout title="Nouvelle stratégie">
      <Head title="Nouvelle stratégie - Admin Le Phare" />

      <Link href="/admin/strategies" className="text-primary text-sm mb-4 inline-block">
        ← Retour aux stratégies
      </Link>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nom</label>
            <Input
              type="text"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              onBlur={() => !data.slug && generateSlug()}
              placeholder="Ex: Ouverture de resto"
              required
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Slug</label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={data.slug}
                onChange={(e) => setData('slug', e.target.value)}
                placeholder="ouverture-resto"
                className="flex-1"
                required
              />
              <Button type="button" variant="outlined" onClick={generateSlug}>
                Générer
              </Button>
            </div>
            {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
            <textarea
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
              placeholder="Description de la stratégie..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              required
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Icône</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {commonIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setData('icon', icon)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors ${
                    data.icon === icon
                      ? 'bg-primary text-white'
                      : 'bg-neutral-100 hover:bg-neutral-200'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <Input
              type="text"
              value={data.icon}
              onChange={(e) => setData('icon', e.target.value)}
              placeholder="Ou entrez un emoji"
              maxLength={4}
            />
          </div>

          {/* Active */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={data.isActive}
              onChange={(e) => setData('isActive', e.target.checked)}
              className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm text-neutral-700">
              Stratégie active (visible dans l'onboarding)
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Link href="/admin/strategies" className="flex-1">
              <Button type="button" variant="outlined" className="w-full">
                Annuler
              </Button>
            </Link>
            <Button type="submit" className="flex-1" disabled={processing}>
              {processing ? 'Création...' : 'Créer la stratégie'}
            </Button>
          </div>
        </form>
      </Card>
    </AdminLayout>
  )
}

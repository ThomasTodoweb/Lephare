import { Head, Link, useForm } from '@inertiajs/react'
import { AdminLayout } from '~/components/layout'
import { Card, Button, Input } from '~/components/ui'

interface Category {
  id: number
  name: string
}

interface Props {
  categories: Category[]
}

export default function AdminTutorialsCreate({ categories }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    categoryId: categories[0]?.id || 0,
    title: '',
    description: '',
    videoUrl: '',
    contentText: '',
    durationMinutes: 5,
    order: 0,
    isActive: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/admin/tutorials')
  }

  return (
    <AdminLayout title="Nouveau tutoriel">
      <Head title="Nouveau tutoriel - Admin Le Phare" />

      <Link href="/admin/tutorials" className="text-primary text-sm mb-4 inline-block">
        ← Retour aux tutoriels
      </Link>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Catégorie</label>
            <select
              value={data.categoryId}
              onChange={(e) => setData('categoryId', Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Titre</label>
            <Input
              type="text"
              value={data.title}
              onChange={(e) => setData('title', e.target.value)}
              placeholder="Ex: Comment prendre de belles photos de plats"
              required
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Description (optionnel)
            </label>
            <textarea
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
              placeholder="Courte description du tutoriel..."
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              URL de la vidéo (optionnel)
            </label>
            <Input
              type="url"
              value={data.videoUrl}
              onChange={(e) => setData('videoUrl', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-neutral-500 mt-1">
              YouTube, Vimeo ou lien direct vers une vidéo
            </p>
          </div>

          {/* Content Text */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Contenu texte (optionnel)
            </label>
            <textarea
              value={data.contentText}
              onChange={(e) => setData('contentText', e.target.value)}
              placeholder="Contenu détaillé du tutoriel (peut contenir du markdown)..."
              rows={6}
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono text-sm"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Durée (minutes)
            </label>
            <Input
              type="number"
              value={data.durationMinutes}
              onChange={(e) => setData('durationMinutes', Number(e.target.value))}
              min={1}
              max={120}
            />
          </div>

          {/* Order */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Ordre (0 = auto)
            </label>
            <Input
              type="number"
              value={data.order}
              onChange={(e) => setData('order', Number(e.target.value))}
              min={0}
            />
            <p className="text-xs text-neutral-500 mt-1">
              Laissez 0 pour ajouter à la fin automatiquement
            </p>
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
              Tutoriel actif (visible pour les utilisateurs)
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Link href="/admin/tutorials" className="flex-1">
              <Button type="button" variant="outlined" className="w-full">
                Annuler
              </Button>
            </Link>
            <Button type="submit" className="flex-1" disabled={processing}>
              {processing ? 'Création...' : 'Créer le tutoriel'}
            </Button>
          </div>
        </form>
      </Card>
    </AdminLayout>
  )
}

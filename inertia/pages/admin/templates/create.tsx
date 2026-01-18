import { Head, Link, useForm } from '@inertiajs/react'
import { AdminLayout } from '~/components/layout'
import { Card, Button, Input } from '~/components/ui'

interface Strategy {
  id: number
  name: string
}

interface Tutorial {
  id: number
  title: string
}

interface Props {
  strategies: Strategy[]
  tutorials: Tutorial[]
}

export default function AdminTemplatesCreate({ strategies, tutorials }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    strategyId: strategies[0]?.id || 0,
    type: 'post' as 'post' | 'story' | 'reel' | 'tuto',
    title: '',
    contentIdea: '',
    order: 0,
    isActive: true,
    tutorialId: null as number | null,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/admin/templates')
  }

  const typeOptions = [
    { value: 'post', label: 'Post', icon: '📸' },
    { value: 'story', label: 'Story', icon: '📱' },
    { value: 'reel', label: 'Reel', icon: '🎬' },
    { value: 'tuto', label: 'Tutoriel', icon: '📚' },
  ]

  return (
    <AdminLayout title="Nouveau template">
      <Head title="Nouveau template - Admin Le Phare" />

      <Link href="/admin/templates" className="text-primary text-sm mb-4 inline-block">
        ← Retour aux templates
      </Link>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Strategy */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Stratégie</label>
            <select
              value={data.strategyId}
              onChange={(e) => setData('strategyId', Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              required
            >
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Type</label>
            <div className="flex gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setData('type', opt.value as typeof data.type)}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                    data.type === opt.value
                      ? 'bg-primary text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <span className="text-lg block mb-1">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Titre</label>
            <Input
              type="text"
              value={data.title}
              onChange={(e) => setData('title', e.target.value)}
              placeholder="Ex: Photo de votre plat signature"
              required
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Content Idea */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Idée de contenu</label>
            <textarea
              value={data.contentIdea}
              onChange={(e) => setData('contentIdea', e.target.value)}
              placeholder="Décrivez l'idée de contenu pour cette mission..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              required
            />
          </div>

          {/* Tutorial link (for tuto type) */}
          {data.type === 'tuto' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Tutoriel associé
              </label>
              <select
                value={data.tutorialId || ''}
                onChange={(e) => setData('tutorialId', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="">Aucun tutoriel</option>
                {tutorials.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              Template actif
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Link href="/admin/templates" className="flex-1">
              <Button type="button" variant="outlined" className="w-full">
                Annuler
              </Button>
            </Link>
            <Button type="submit" className="flex-1" disabled={processing}>
              {processing ? 'Création...' : 'Créer le template'}
            </Button>
          </div>
        </form>
      </Card>
    </AdminLayout>
  )
}

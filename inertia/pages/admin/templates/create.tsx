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
    type: 'post' as 'post' | 'carousel' | 'story' | 'reel' | 'engagement',
    title: '',
    contentIdea: '',
    order: 0,
    isActive: true,
    tutorialId: null as number | null,
    requiredTutorialId: null as number | null,
    notificationTime: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/admin/templates')
  }

  // Les tutos sont gérés séparément dans /admin/tutorials
  const typeOptions = [
    { value: 'post', label: 'Post', icon: '📸' },
    { value: 'carousel', label: 'Carrousel', icon: '🎠' },
    { value: 'story', label: 'Story', icon: '📱' },
    { value: 'reel', label: 'Reel', icon: '🎬' },
    { value: 'engagement', label: 'Engagement', icon: '💬' },
  ]

  return (
    <AdminLayout title="Nouvelle mission">
      <Head title="Nouvelle mission - Admin Le Phare" />

      <Link href="/admin/templates" className="text-primary text-sm mb-4 inline-block">
        ← Retour aux missions
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

          {/* Tutorial link */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Tutoriel associé (optionnel)
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
            <p className="text-xs text-neutral-500 mt-1">
              Ce tutoriel sera suggéré à l'utilisateur lors de la mission
            </p>
          </div>

          {/* Required Tutorial (prerequisite) - for all types */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Tutoriel prérequis (optionnel)
            </label>
            <select
              value={data.requiredTutorialId || ''}
              onChange={(e) => setData('requiredTutorialId', e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Aucun prérequis</option>
              {tutorials.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 mt-1">
              L'utilisateur devra compléter ce tutoriel avant de débloquer cette mission
            </p>
          </div>

          {/* Notification Time */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Heure de notification (optionnel)
            </label>
            <Input
              type="time"
              value={data.notificationTime}
              onChange={(e) => setData('notificationTime', e.target.value)}
            />
            <p className="text-xs text-neutral-500 mt-1">
              Si vide, l'heure par défaut de l'utilisateur sera utilisée.
            </p>
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
              Mission active
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
              {processing ? 'Création...' : 'Créer la mission'}
            </Button>
          </div>
        </form>
      </Card>
    </AdminLayout>
  )
}

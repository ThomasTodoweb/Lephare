import { Head, Link, useForm } from '@inertiajs/react'
import { useState } from 'react'
import { AdminLayout } from '~/components/layout'
import { Card, Button, Input } from '~/components/ui'
import { Plus, Trash2, Edit2, Check, X, Lightbulb } from 'lucide-react'

interface ContentIdea {
  id: number
  suggestionText: string
  photoTips: string | null
  isActive: boolean
}

interface Template {
  id: number
  strategyId: number
  type: 'post' | 'story' | 'reel' | 'tuto'
  title: string
  contentIdea: string
  order: number
  isActive: boolean
  tutorialId: number | null
  requiredTutorialId: number | null
  ideas?: ContentIdea[]
}

interface Strategy {
  id: number
  name: string
}

interface Tutorial {
  id: number
  title: string
}

interface Props {
  template: Template
  strategies: Strategy[]
  tutorials: Tutorial[]
}

export default function AdminTemplatesEdit({ template, strategies, tutorials }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    strategyId: template.strategyId,
    type: template.type,
    title: template.title,
    contentIdea: template.contentIdea,
    order: template.order,
    isActive: template.isActive,
    tutorialId: template.tutorialId,
    requiredTutorialId: template.requiredTutorialId,
  })

  // Ideas state management
  const [ideas, setIdeas] = useState<ContentIdea[]>(template.ideas || [])
  const [isAddingIdea, setIsAddingIdea] = useState(false)
  const [editingIdeaId, setEditingIdeaId] = useState<number | null>(null)
  const [newIdea, setNewIdea] = useState({ suggestionText: '', photoTips: '' })
  const [editIdea, setEditIdea] = useState({ suggestionText: '', photoTips: '' })
  const [ideaLoading, setIdeaLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    put(`/admin/templates/${template.id}`)
  }

  // Get CSRF token helper
  const getXsrfToken = () => {
    const xsrfCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1]
    return xsrfCookie ? decodeURIComponent(xsrfCookie) : ''
  }

  // Add new idea
  const handleAddIdea = async () => {
    if (!newIdea.suggestionText.trim()) return
    setIdeaLoading(true)

    try {
      const response = await fetch(`/admin/templates/${template.id}/ideas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getXsrfToken(),
        },
        body: JSON.stringify({
          missionTemplateId: template.id,
          suggestionText: newIdea.suggestionText.trim(),
          photoTips: newIdea.photoTips.trim() || null,
          isActive: true,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setIdeas([...ideas, result.idea])
        setNewIdea({ suggestionText: '', photoTips: '' })
        setIsAddingIdea(false)
      }
    } catch (err) {
      console.error('Error adding idea:', err)
    } finally {
      setIdeaLoading(false)
    }
  }

  // Update existing idea
  const handleUpdateIdea = async (ideaId: number) => {
    if (!editIdea.suggestionText.trim()) return
    setIdeaLoading(true)

    try {
      const response = await fetch(`/admin/ideas/${ideaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getXsrfToken(),
        },
        body: JSON.stringify({
          suggestionText: editIdea.suggestionText.trim(),
          photoTips: editIdea.photoTips.trim() || null,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setIdeas(ideas.map((idea) => (idea.id === ideaId ? result.idea : idea)))
        setEditingIdeaId(null)
      }
    } catch (err) {
      console.error('Error updating idea:', err)
    } finally {
      setIdeaLoading(false)
    }
  }

  // Toggle idea active status
  const handleToggleIdea = async (ideaId: number) => {
    try {
      const response = await fetch(`/admin/ideas/${ideaId}/toggle`, {
        method: 'POST',
        headers: {
          'X-XSRF-TOKEN': getXsrfToken(),
        },
      })

      if (response.ok) {
        const result = await response.json()
        setIdeas(ideas.map((idea) => (idea.id === ideaId ? { ...idea, isActive: result.isActive } : idea)))
      }
    } catch (err) {
      console.error('Error toggling idea:', err)
    }
  }

  // Delete idea
  const handleDeleteIdea = async (ideaId: number) => {
    if (!confirm('Supprimer cette idee ?')) return

    try {
      const response = await fetch(`/admin/ideas/${ideaId}`, {
        method: 'DELETE',
        headers: {
          'X-XSRF-TOKEN': getXsrfToken(),
        },
      })

      if (response.ok) {
        setIdeas(ideas.filter((idea) => idea.id !== ideaId))
      }
    } catch (err) {
      console.error('Error deleting idea:', err)
    }
  }

  // Start editing an idea
  const startEditingIdea = (idea: ContentIdea) => {
    setEditingIdeaId(idea.id)
    setEditIdea({
      suggestionText: idea.suggestionText,
      photoTips: idea.photoTips || '',
    })
  }

  const typeOptions = [
    { value: 'post', label: 'Post', icon: '📸' },
    { value: 'story', label: 'Story', icon: '📱' },
    { value: 'reel', label: 'Reel', icon: '🎬' },
    { value: 'tuto', label: 'Tutoriel', icon: '📚' },
  ]

  return (
    <AdminLayout title={`Modifier: ${template.title}`}>
      <Head title={`Modifier ${template.title} - Admin Le Phare`} />

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

          {/* Order */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Ordre</label>
            <Input
              type="number"
              value={data.order}
              onChange={(e) => setData('order', Number(e.target.value))}
              min={1}
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
              {processing ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Content Ideas Section */}
      <Card className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-neutral-900">Idees de contenu</h2>
          </div>
          {!isAddingIdea && (
            <Button
              type="button"
              variant="outlined"
              onClick={() => setIsAddingIdea(true)}
              className="flex items-center gap-1 text-sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </Button>
          )}
        </div>

        <p className="text-sm text-neutral-500 mb-4">
          Ces idees seront proposees aux utilisateurs lors de la creation d'une publication pour cette mission.
        </p>

        {/* Add new idea form */}
        {isAddingIdea && (
          <div className="bg-neutral-50 rounded-lg p-4 mb-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Suggestion
                </label>
                <textarea
                  value={newIdea.suggestionText}
                  onChange={(e) => setNewIdea({ ...newIdea, suggestionText: e.target.value })}
                  placeholder="Ex: Prenez une photo de votre plat signature avec une belle mise en scene"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Conseils photo (optionnel)
                </label>
                <textarea
                  value={newIdea.photoTips}
                  onChange={(e) => setNewIdea({ ...newIdea, photoTips: e.target.value })}
                  placeholder="Ex: Utilisez la lumiere naturelle, cadrez en plongee"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => {
                    setIsAddingIdea(false)
                    setNewIdea({ suggestionText: '', photoTips: '' })
                  }}
                  className="text-sm"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={handleAddIdea}
                  disabled={ideaLoading || !newIdea.suggestionText.trim()}
                  className="text-sm"
                >
                  {ideaLoading ? 'Ajout...' : 'Ajouter'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Ideas list */}
        {ideas.length === 0 && !isAddingIdea ? (
          <p className="text-neutral-400 text-sm text-center py-6">
            Aucune idee de contenu pour cette mission
          </p>
        ) : (
          <div className="space-y-3">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className={`border rounded-lg p-3 ${idea.isActive ? 'border-neutral-200 bg-white' : 'border-neutral-100 bg-neutral-50 opacity-60'}`}
              >
                {editingIdeaId === idea.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editIdea.suggestionText}
                      onChange={(e) => setEditIdea({ ...editIdea, suggestionText: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                    />
                    <textarea
                      value={editIdea.photoTips}
                      onChange={(e) => setEditIdea({ ...editIdea, photoTips: e.target.value })}
                      placeholder="Conseils photo (optionnel)"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingIdeaId(null)}
                        className="p-2 text-neutral-500 hover:text-neutral-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateIdea(idea.id)}
                        disabled={ideaLoading}
                        className="p-2 text-green-600 hover:text-green-700"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-neutral-800">{idea.suggestionText}</p>
                        {idea.photoTips && (
                          <p className="text-xs text-neutral-500 mt-1">
                            Conseils: {idea.photoTips}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEditingIdea(idea)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-600"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleIdea(idea.id)}
                          className={`p-1.5 ${idea.isActive ? 'text-green-500 hover:text-green-600' : 'text-neutral-400 hover:text-neutral-600'}`}
                          title={idea.isActive ? 'Desactiver' : 'Activer'}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteIdea(idea.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-500"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </AdminLayout>
  )
}

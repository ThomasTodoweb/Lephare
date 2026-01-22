import { Head, Link, useForm } from '@inertiajs/react'
import { useState, useRef } from 'react'
import { AdminLayout } from '~/components/layout'
import { Card, Button, Input } from '~/components/ui'
import { Plus, Trash2, Edit2, Check, X, Lightbulb, Tag, Upload, Image, Film } from 'lucide-react'

type RestaurantType = 'brasserie' | 'gastronomique' | 'fast_food' | 'pizzeria' | 'cafe_bar' | 'autre'

const RESTAURANT_TYPES: { value: RestaurantType; label: string }[] = [
  { value: 'brasserie', label: 'Brasserie' },
  { value: 'gastronomique', label: 'Gastronomique' },
  { value: 'fast_food', label: 'Fast-food' },
  { value: 'pizzeria', label: 'Pizzeria' },
  { value: 'cafe_bar', label: 'Cafe / Bar' },
  { value: 'autre', label: 'Autre' },
]

interface ContentIdea {
  id: number
  suggestionText: string
  photoTips: string | null
  isActive: boolean
  restaurantTags: RestaurantType[] | null
  exampleMediaPath: string | null
  exampleMediaType: 'image' | 'video' | null
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
  const [newIdea, setNewIdea] = useState({ suggestionText: '', photoTips: '', restaurantTags: [] as RestaurantType[] })
  const [editIdea, setEditIdea] = useState({ suggestionText: '', photoTips: '', restaurantTags: [] as RestaurantType[] })
  const [ideaLoading, setIdeaLoading] = useState(false)

  // Media upload state
  const [newMediaFile, setNewMediaFile] = useState<File | null>(null)
  const [newMediaPreview, setNewMediaPreview] = useState<string | null>(null)
  const [editMediaFile, setEditMediaFile] = useState<File | null>(null)
  const [editMediaPreview, setEditMediaPreview] = useState<string | null>(null)
  const [removeEditMedia, setRemoveEditMedia] = useState(false)
  const newMediaInputRef = useRef<HTMLInputElement>(null)
  const editMediaInputRef = useRef<HTMLInputElement>(null)

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

  // Handle media file selection for new idea
  const handleNewMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewMediaFile(file)
      const url = URL.createObjectURL(file)
      setNewMediaPreview(url)
    }
  }

  // Handle media file selection for edit idea
  const handleEditMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEditMediaFile(file)
      const url = URL.createObjectURL(file)
      setEditMediaPreview(url)
      setRemoveEditMedia(false)
    }
  }

  // Clear new media
  const clearNewMedia = () => {
    setNewMediaFile(null)
    if (newMediaPreview) {
      URL.revokeObjectURL(newMediaPreview)
    }
    setNewMediaPreview(null)
    if (newMediaInputRef.current) {
      newMediaInputRef.current.value = ''
    }
  }

  // Clear edit media
  const clearEditMedia = () => {
    setEditMediaFile(null)
    if (editMediaPreview) {
      URL.revokeObjectURL(editMediaPreview)
    }
    setEditMediaPreview(null)
    if (editMediaInputRef.current) {
      editMediaInputRef.current.value = ''
    }
  }

  // Add new idea with media
  const handleAddIdea = async () => {
    if (!newIdea.suggestionText.trim()) return
    setIdeaLoading(true)

    try {
      const formData = new FormData()
      formData.append('missionTemplateId', String(template.id))
      formData.append('suggestionText', newIdea.suggestionText.trim())
      formData.append('photoTips', newIdea.photoTips.trim() || '')
      formData.append('isActive', 'true')
      formData.append('restaurantTags', JSON.stringify(newIdea.restaurantTags.length > 0 ? newIdea.restaurantTags : []))

      if (newMediaFile) {
        formData.append('exampleMedia', newMediaFile)
      }

      const response = await fetch(`/admin/templates/${template.id}/ideas`, {
        method: 'POST',
        headers: {
          'X-XSRF-TOKEN': getXsrfToken(),
        },
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setIdeas([...ideas, result.idea])
        setNewIdea({ suggestionText: '', photoTips: '', restaurantTags: [] })
        clearNewMedia()
        setIsAddingIdea(false)
      }
    } catch (err) {
      console.error('Error adding idea:', err)
    } finally {
      setIdeaLoading(false)
    }
  }

  // Update existing idea with media
  const handleUpdateIdea = async (ideaId: number) => {
    if (!editIdea.suggestionText.trim()) return
    setIdeaLoading(true)

    try {
      const formData = new FormData()
      formData.append('suggestionText', editIdea.suggestionText.trim())
      formData.append('photoTips', editIdea.photoTips.trim() || '')
      formData.append('restaurantTags', JSON.stringify(editIdea.restaurantTags.length > 0 ? editIdea.restaurantTags : []))

      if (editMediaFile) {
        formData.append('exampleMedia', editMediaFile)
      }
      if (removeEditMedia) {
        formData.append('removeMedia', 'true')
      }

      const response = await fetch(`/admin/ideas/${ideaId}`, {
        method: 'PUT',
        headers: {
          'X-XSRF-TOKEN': getXsrfToken(),
        },
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setIdeas(ideas.map((idea) => (idea.id === ideaId ? result.idea : idea)))
        setEditingIdeaId(null)
        clearEditMedia()
        setRemoveEditMedia(false)
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
      restaurantTags: idea.restaurantTags || [],
    })
    clearEditMedia()
    setRemoveEditMedia(false)
  }

  // Toggle tag in array
  const toggleTag = (tags: RestaurantType[], tag: RestaurantType): RestaurantType[] => {
    if (tags.includes(tag)) {
      return tags.filter((t) => t !== tag)
    }
    return [...tags, tag]
  }

  // Get label for restaurant type
  const getTagLabel = (tag: RestaurantType): string => {
    return RESTAURANT_TYPES.find((t) => t.value === tag)?.label || tag
  }

  // Check if file is video
  const isVideo = (file: File | null, mediaType: string | null): boolean => {
    if (file) {
      return file.type.startsWith('video/')
    }
    return mediaType === 'video'
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
            <label className="block text-sm font-medium text-neutral-700 mb-1">Strategie</label>
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
            <label className="block text-sm font-medium text-neutral-700 mb-1">Idee de contenu</label>
            <textarea
              value={data.contentIdea}
              onChange={(e) => setData('contentIdea', e.target.value)}
              placeholder="Decrivez l'idee de contenu pour cette mission..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              required
            />
          </div>

          {/* Tutorial link (for tuto type) */}
          {data.type === 'tuto' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Tutoriel associe
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
              Tutoriel prerequis (optionnel)
            </label>
            <select
              value={data.requiredTutorialId || ''}
              onChange={(e) => setData('requiredTutorialId', e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Aucun prerequis</option>
              {tutorials.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 mt-1">
              L'utilisateur devra completer ce tutoriel avant de debloquer cette mission
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
            <h2 className="text-lg font-semibold text-neutral-900">Inspirations visuelles</h2>
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
          Ces exemples visuels (photos/videos) seront proposes aux utilisateurs pour les inspirer lors de la creation de leur publication.
        </p>

        {/* Add new idea form */}
        {isAddingIdea && (
          <div className="bg-neutral-50 rounded-lg p-4 mb-4">
            <div className="space-y-4">
              {/* Media Upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <Upload className="w-4 h-4 inline mr-1" />
                  Exemple visuel (photo ou video)
                </label>
                <input
                  ref={newMediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleNewMediaSelect}
                  className="hidden"
                />
                {newMediaPreview ? (
                  <div className="relative inline-block">
                    {isVideo(newMediaFile, null) ? (
                      <video
                        src={newMediaPreview}
                        className="w-40 h-40 object-cover rounded-lg"
                        controls
                      />
                    ) : (
                      <img
                        src={newMediaPreview}
                        alt="Preview"
                        className="w-40 h-40 object-cover rounded-lg"
                      />
                    )}
                    <button
                      type="button"
                      onClick={clearNewMedia}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => newMediaInputRef.current?.click()}
                    className="w-40 h-40 border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center text-neutral-400 hover:border-primary hover:text-primary transition-colors"
                  >
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-xs">Ajouter un media</span>
                  </button>
                )}
              </div>

              {/* Suggestion Text */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description / Suggestion
                </label>
                <textarea
                  value={newIdea.suggestionText}
                  onChange={(e) => setNewIdea({ ...newIdea, suggestionText: e.target.value })}
                  placeholder="Ex: Un plat signature presente de maniere elegante"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                />
              </div>

              {/* Photo Tips */}
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

              {/* Restaurant Tags */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Types de restaurant (laisser vide = tous)
                </label>
                <div className="flex flex-wrap gap-2">
                  {RESTAURANT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setNewIdea({ ...newIdea, restaurantTags: toggleTag(newIdea.restaurantTags, type.value) })}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        newIdea.restaurantTags.includes(type.value)
                          ? 'bg-primary text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  {newIdea.restaurantTags.length === 0 ? 'Visible pour tous les types' : `Visible pour: ${newIdea.restaurantTags.map(getTagLabel).join(', ')}`}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => {
                    setIsAddingIdea(false)
                    setNewIdea({ suggestionText: '', photoTips: '', restaurantTags: [] })
                    clearNewMedia()
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
            Aucune inspiration visuelle pour cette mission
          </p>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className={`border rounded-lg overflow-hidden ${idea.isActive ? 'border-neutral-200 bg-white' : 'border-neutral-100 bg-neutral-50 opacity-60'}`}
              >
                {editingIdeaId === idea.id ? (
                  <div className="p-4 space-y-3">
                    {/* Edit Media Upload */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-2">
                        Exemple visuel
                      </label>
                      <input
                        ref={editMediaInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleEditMediaSelect}
                        className="hidden"
                      />
                      {editMediaPreview ? (
                        <div className="relative inline-block">
                          {isVideo(editMediaFile, null) ? (
                            <video
                              src={editMediaPreview}
                              className="w-32 h-32 object-cover rounded-lg"
                              controls
                            />
                          ) : (
                            <img
                              src={editMediaPreview}
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded-lg"
                            />
                          )}
                          <button
                            type="button"
                            onClick={clearEditMedia}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : idea.exampleMediaPath && !removeEditMedia ? (
                        <div className="relative inline-block">
                          {idea.exampleMediaType === 'video' ? (
                            <video
                              src={`/${idea.exampleMediaPath}`}
                              className="w-32 h-32 object-cover rounded-lg"
                              controls
                            />
                          ) : (
                            <img
                              src={`/${idea.exampleMediaPath}`}
                              alt="Example"
                              className="w-32 h-32 object-cover rounded-lg"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => setRemoveEditMedia(true)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => editMediaInputRef.current?.click()}
                          className="w-32 h-32 border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center text-neutral-400 hover:border-primary hover:text-primary transition-colors"
                        >
                          <Upload className="w-6 h-6 mb-1" />
                          <span className="text-xs">Ajouter</span>
                        </button>
                      )}
                    </div>

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
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        Types de restaurant
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {RESTAURANT_TYPES.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setEditIdea({ ...editIdea, restaurantTags: toggleTag(editIdea.restaurantTags, type.value) })}
                            className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                              editIdea.restaurantTags.includes(type.value)
                                ? 'bg-primary text-white'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIdeaId(null)
                          clearEditMedia()
                          setRemoveEditMedia(false)
                        }}
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
                  <>
                    {/* Media Preview */}
                    {idea.exampleMediaPath ? (
                      <div className="aspect-square bg-neutral-100">
                        {idea.exampleMediaType === 'video' ? (
                          <video
                            src={`/${idea.exampleMediaPath}`}
                            className="w-full h-full object-cover"
                            controls
                          />
                        ) : (
                          <img
                            src={`/${idea.exampleMediaPath}`}
                            alt={idea.suggestionText}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="aspect-square bg-neutral-100 flex items-center justify-center">
                        <div className="text-center text-neutral-400">
                          <Image className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-xs">Pas de media</p>
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-3">
                      <p className="text-sm text-neutral-800 line-clamp-2">{idea.suggestionText}</p>
                      {idea.photoTips && (
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                          Conseils: {idea.photoTips}
                        </p>
                      )}
                      {idea.restaurantTags && idea.restaurantTags.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {idea.restaurantTags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700"
                            >
                              {getTagLabel(tag)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-400 mt-2">Tous types</p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-neutral-100">
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
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </AdminLayout>
  )
}

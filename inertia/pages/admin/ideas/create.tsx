import { Head, Link, router } from '@inertiajs/react'
import { AdminLayout } from '~/components/layout'
import { useState, useRef } from 'react'
import { ArrowLeft, Upload, X, Play, Save } from 'lucide-react'

type RestaurantType = 'brasserie' | 'gastronomique' | 'fast_food' | 'pizzeria' | 'cafe_bar' | 'autre'
type ContentType = 'post' | 'carousel' | 'story' | 'reel'

interface ThematicCategory {
  id: number
  name: string
  slug: string
  icon: string | null
}

interface Props {
  categories: ThematicCategory[]
}

const CONTENT_TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: 'post', label: 'Post' },
  { value: 'carousel', label: 'Carrousel' },
  { value: 'story', label: 'Story' },
  { value: 'reel', label: 'Reel' },
]

const RESTAURANT_TYPE_OPTIONS: { value: RestaurantType; label: string }[] = [
  { value: 'brasserie', label: 'Brasserie' },
  { value: 'gastronomique', label: 'Gastronomique' },
  { value: 'fast_food', label: 'Fast Food' },
  { value: 'pizzeria', label: 'Pizzeria' },
  { value: 'cafe_bar', label: 'Café/Bar' },
  { value: 'autre', label: 'Autre' },
]

export default function CreateIdea({ categories }: Props) {
  const [title, setTitle] = useState('')
  const [suggestionText, setSuggestionText] = useState('')
  const [photoTips, setPhotoTips] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [contentTypes, setContentTypes] = useState<ContentType[]>([])
  const [thematicCategoryIds, setThematicCategoryIds] = useState<number[]>([])
  const [restaurantTags, setRestaurantTags] = useState<RestaurantType[]>([])
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [isVideo, setIsVideo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isVideoFile = file.type.startsWith('video/')
    setIsVideo(isVideoFile)
    setMediaFile(file)

    const url = URL.createObjectURL(file)
    setMediaPreview(url)
  }

  const handleRemoveMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
    setIsVideo(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const toggleContentType = (type: ContentType) => {
    setContentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const toggleCategory = (id: number) => {
    setThematicCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleRestaurantTag = (tag: RestaurantType) => {
    setRestaurantTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const formData: Record<string, unknown> = {
      suggestionText,
      isActive: isActive.toString(),
    }

    if (title) formData.title = title
    if (photoTips) formData.photoTips = photoTips
    if (contentTypes.length > 0) formData.contentTypes = JSON.stringify(contentTypes)
    if (thematicCategoryIds.length > 0) formData.thematicCategoryIds = JSON.stringify(thematicCategoryIds)
    if (restaurantTags.length > 0) formData.restaurantTags = JSON.stringify(restaurantTags)
    if (mediaFile) formData.exampleMedia = mediaFile

    router.post('/admin/ideas', formData, {
      forceFormData: true,
      onError: (errors) => {
        const errorMsg = Object.values(errors).flat().join(', ') || 'Erreur lors de la création'
        setError(errorMsg)
        setSaving(false)
      },
      onFinish: () => {
        setSaving(false)
      },
    })
  }

  return (
    <AdminLayout>
      <Head title="Nouvelle idée - Admin" />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/ideas"
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nouvelle idée</h1>
            <p className="text-gray-600">Créer une inspiration visuelle pour les publications</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Media Upload */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Média exemple</h2>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {mediaPreview ? (
              <div className="relative aspect-square max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden">
                {isVideo ? (
                  <>
                    <video
                      ref={videoRef}
                      src={mediaPreview}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      onMouseEnter={() => videoRef.current?.play()}
                      onMouseLeave={() => {
                        if (videoRef.current) {
                          videoRef.current.pause()
                          videoRef.current.currentTime = 0
                        }
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
                        <Play className="h-8 w-8 text-white ml-1" />
                      </div>
                    </div>
                  </>
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-md mx-auto aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                <Upload className="h-12 w-12 mb-2" />
                <span className="text-sm">Cliquer pour ajouter une image ou vidéo</span>
                <span className="text-xs mt-1">JPG, PNG, GIF, WebP, MP4, MOV, WebM</span>
              </button>
            )}
          </div>

          {/* Content Types */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Types de contenu</h2>
            <p className="text-sm text-gray-600 mb-4">
              Pour quels types de publication cette idée est-elle adaptée ?
            </p>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleContentType(value)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    contentTypes.includes(value)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-blue-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {contentTypes.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Si aucun type n'est sélectionné, l'idée s'appliquera à tous les types.
              </p>
            )}
          </div>

          {/* Thematic Categories */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Catégories thématiques</h2>
            <p className="text-sm text-gray-600 mb-4">
              À quelles thématiques cette idée correspond-elle ?
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    thematicCategoryIds.includes(cat.id)
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-purple-500'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
            {thematicCategoryIds.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Si aucune catégorie n'est sélectionnée, l'idée s'appliquera à toutes les catégories.
              </p>
            )}
          </div>

          {/* Restaurant Types */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Types de restaurant</h2>
            <p className="text-sm text-gray-600 mb-4">
              Pour quels types de restaurant cette idée est-elle adaptée ?
            </p>
            <div className="flex flex-wrap gap-2">
              {RESTAURANT_TYPE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleRestaurantTag(value)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    restaurantTags.includes(value)
                      ? 'bg-orange-600 border-orange-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-orange-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {restaurantTags.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Si aucun type n'est sélectionné, l'idée s'appliquera à tous les restaurants.
              </p>
            )}
          </div>

          {/* Text Content */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contenu</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre (optionnel)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Photo de plat du jour style bistro"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
                placeholder="Décrivez l'idée de contenu..."
                rows={3}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conseils photo (optionnel)
              </label>
              <textarea
                value={photoTips}
                onChange={(e) => setPhotoTips(e.target.value)}
                placeholder="Conseils pour prendre une bonne photo/vidéo..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Idée active (visible pour les utilisateurs)
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link
              href="/admin/ideas"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving || !suggestionText.trim()}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-5 w-5 mr-2" />
              {saving ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

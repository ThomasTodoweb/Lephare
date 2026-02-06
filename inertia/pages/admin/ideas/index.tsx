import { Head, Link, router, usePage } from '@inertiajs/react'
import { AdminLayout } from '~/components/layout'
import { useState } from 'react'
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Search, X, Image, Zap, Loader2 } from 'lucide-react'
import { LazyVideo } from '~/components/ui/LazyVideo'

type RestaurantType = 'brasserie' | 'gastronomique' | 'fast_food' | 'pizzeria' | 'cafe_bar' | 'autre'
type ContentType = 'post' | 'carousel' | 'story' | 'reel'

interface ThematicCategory {
  id: number
  name: string
  slug: string
  icon: string | null
}

interface ContentIdea {
  id: number
  title: string | null
  suggestionText: string
  photoTips: string | null
  isActive: boolean
  restaurantTags: RestaurantType[] | null
  contentTypes: ContentType[] | null
  thematicCategoryIds: number[] | null
  exampleMediaPath: string | null
  exampleMediaType: 'image' | 'video' | null
  isOptimized: boolean
}

interface Props {
  ideas: ContentIdea[]
  categories: ThematicCategory[]
  filters: {
    contentType: string | null
    category: string | null
  }
  optimizationStats: {
    total: number
    optimized: number
    pending: number
  }
}

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  post: 'Post',
  carousel: 'Carrousel',
  story: 'Story',
  reel: 'Reel',
}

const RESTAURANT_TYPE_LABELS: Record<RestaurantType, string> = {
  brasserie: 'Brasserie',
  gastronomique: 'Gastronomique',
  fast_food: 'Fast Food',
  pizzeria: 'Pizzeria',
  cafe_bar: 'Café/Bar',
  autre: 'Autre',
}

export default function IdeasIndex({ ideas, categories, filters, optimizationStats }: Props) {
  const { flash } = usePage<{ flash?: { success?: string; warning?: string; info?: string } }>().props
  const [search, setSearch] = useState('')
  const [contentTypeFilter, setContentTypeFilter] = useState(filters.contentType || '')
  const [categoryFilter, setCategoryFilter] = useState(filters.category || '')
  const [optimizing, setOptimizing] = useState(false)

  const filteredIdeas = ideas.filter((idea) => {
    if (search) {
      const searchLower = search.toLowerCase()
      const matchesTitle = idea.title?.toLowerCase().includes(searchLower)
      const matchesText = idea.suggestionText.toLowerCase().includes(searchLower)
      if (!matchesTitle && !matchesText) return false
    }
    return true
  })

  const handleToggle = (id: number) => {
    router.post(`/admin/ideas/${id}/toggle`, {}, {
      preserveScroll: true,
      onError: (errors) => {
        console.error('Error toggling idea:', errors)
      },
    })
  }

  const handleDelete = (id: number) => {
    if (!confirm('Supprimer cette idée ?')) return
    router.delete(`/admin/ideas/${id}`, {
      preserveScroll: true,
      onError: (errors) => {
        console.error('Error deleting idea:', errors)
      },
    })
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (contentTypeFilter) params.set('contentType', contentTypeFilter)
    if (categoryFilter) params.set('category', categoryFilter)
    router.get(`/admin/ideas?${params.toString()}`)
  }

  const clearFilters = () => {
    setContentTypeFilter('')
    setCategoryFilter('')
    router.get('/admin/ideas')
  }

  const getCategoryName = (id: number) => {
    const cat = categories.find((c) => c.id === id)
    return cat ? `${cat.icon || ''} ${cat.name}`.trim() : `#${id}`
  }

  const handleOptimizeAll = () => {
    if (optimizing) return
    if (optimizationStats.pending === 0) {
      alert('Tous les médias sont déjà optimisés !')
      return
    }
    if (!confirm(`Optimiser ${optimizationStats.pending} média(s) non optimisé(s) ?\n\nCette opération peut prendre plusieurs minutes.`)) return

    setOptimizing(true)
    router.post('/admin/ideas/optimization/all', {}, {
      preserveScroll: true,
      onFinish: () => setOptimizing(false),
    })
  }

  return (
    <AdminLayout>
      <Head title="Gestion des Idées - Admin" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Idées de contenu</h1>
            <p className="text-gray-600 mt-1">
              Gérez les inspirations visuelles pour les publications
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleOptimizeAll}
              disabled={optimizing}
              className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {optimizing ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Zap className="h-5 w-5 mr-2" />
              )}
              {optimizing ? 'Optimisation...' : `Optimiser (${optimizationStats.pending})`}
            </button>
            <Link
              href="/admin/ideas/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouvelle idée
            </Link>
          </div>
        </div>

        {/* Flash Messages */}
        {flash?.success && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="font-medium text-green-800">{flash.success}</p>
          </div>
        )}
        {flash?.warning && (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="font-medium text-amber-800">{flash.warning}</p>
          </div>
        )}
        {flash?.info && (
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="font-medium text-blue-800">{flash.info}</p>
          </div>
        )}

        {/* Optimization Stats */}
        {optimizationStats.total > 0 && (
          <div className="text-sm text-gray-600">
            Médias: {optimizationStats.optimized}/{optimizationStats.total} optimisés
            {optimizationStats.pending > 0 && (
              <span className="ml-2 text-amber-600">({optimizationStats.pending} en attente)</span>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Content Type Filter */}
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de contenu</label>
              <select
                value={contentTypeFilter}
                onChange={(e) => setContentTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous</option>
                {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Toutes</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Filtrer
              </button>
              {(contentTypeFilter || categoryFilter) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Ideas Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              categories={categories}
              onToggle={() => handleToggle(idea.id)}
              onDelete={() => handleDelete(idea.id)}
              getCategoryName={getCategoryName}
            />
          ))}
        </div>

        {filteredIdeas.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Aucune idée trouvée</p>
            <Link
              href="/admin/ideas/create"
              className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Créer une idée
            </Link>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

interface IdeaCardProps {
  idea: ContentIdea
  categories: ThematicCategory[]
  onToggle: () => void
  onDelete: () => void
  getCategoryName: (id: number) => string
}

function IdeaCard({ idea, onToggle, onDelete, getCategoryName }: IdeaCardProps) {
  const isVideo = idea.exampleMediaType === 'video'

  return (
    <div
      className={`bg-white rounded-lg shadow overflow-hidden ${!idea.isActive ? 'opacity-60' : ''}`}
    >
      {/* Media Preview */}
      <div className="aspect-square bg-gray-100 relative">
        {idea.exampleMediaPath ? (
          isVideo ? (
            <LazyVideo
              src={`/${idea.exampleMediaPath}`}
              className="w-full h-full"
            />
          ) : (
            <img
              src={`/${idea.exampleMediaPath}`}
              alt={idea.title || 'Idée'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="h-12 w-12 text-gray-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 truncate">
          {idea.title || idea.suggestionText.slice(0, 30) + '...'}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {/* Content Types */}
          {idea.contentTypes?.map((type) => (
            <span
              key={type}
              className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full"
            >
              {CONTENT_TYPE_LABELS[type]}
            </span>
          ))}

          {/* Thematic Categories */}
          {idea.thematicCategoryIds?.slice(0, 2).map((catId) => (
            <span
              key={catId}
              className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full"
            >
              {getCategoryName(catId)}
            </span>
          ))}
          {(idea.thematicCategoryIds?.length || 0) > 2 && (
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
              +{idea.thematicCategoryIds!.length - 2}
            </span>
          )}
        </div>

        {/* Restaurant Tags */}
        {idea.restaurantTags && idea.restaurantTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {idea.restaurantTags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full"
              >
                {RESTAURANT_TYPE_LABELS[tag]}
              </span>
            ))}
            {idea.restaurantTags.length > 2 && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                +{idea.restaurantTags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={onToggle}
            className={`p-1.5 rounded-lg transition-colors ${
              idea.isActive
                ? 'text-green-600 hover:bg-green-50'
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title={idea.isActive ? 'Désactiver' : 'Activer'}
          >
            {idea.isActive ? (
              <ToggleRight className="h-5 w-5" />
            ) : (
              <ToggleLeft className="h-5 w-5" />
            )}
          </button>

          <div className="flex gap-1">
            <Link
              href={`/admin/ideas/${idea.id}/edit`}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Modifier"
            >
              <Edit className="h-5 w-5" />
            </Link>
            <button
              onClick={onDelete}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

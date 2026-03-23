import { Head, Link, router, usePage } from '@inertiajs/react'
import { AdminLayout } from '~/components/layout'
import { useState, useCallback, useMemo } from 'react'
import {
  Plus, Edit, Trash2, ToggleLeft, ToggleRight, Search, X, Image as ImageIcon,
  Zap, Loader2, Grid3X3, List, SlidersHorizontal, ChevronDown, Maximize2
} from 'lucide-react'
import { LazyVideo } from '~/components/ui/LazyVideo'
import { Card } from '~/components/ui'

// --- Types ---

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

const CONTENT_TYPE_COLORS: Record<ContentType, string> = {
  post: 'bg-blue-50 text-blue-700',
  carousel: 'bg-green-50 text-green-700',
  story: 'bg-purple-50 text-purple-700',
  reel: 'bg-red-50 text-red-700',
}

const RESTAURANT_TYPE_LABELS: Record<RestaurantType, string> = {
  brasserie: 'Brasserie',
  gastronomique: 'Gastronomique',
  fast_food: 'Fast Food',
  pizzeria: 'Pizzeria',
  cafe_bar: 'Café/Bar',
  autre: 'Autre',
}

// --- Lightbox ---

function Lightbox({
  idea,
  onClose,
  getCategoryName,
}: {
  idea: ContentIdea
  onClose: () => void
  getCategoryName: (id: number) => string
}) {
  const isVideo = idea.exampleMediaType === 'video'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media */}
        <div className="md:w-1/2 bg-neutral-100 flex items-center justify-center min-h-[300px]">
          {idea.exampleMediaPath ? (
            isVideo ? (
              <LazyVideo src={`/${idea.exampleMediaPath}`} className="w-full h-full" />
            ) : (
              <img
                src={`/${idea.exampleMediaPath}`}
                alt={idea.title || 'Idée'}
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <ImageIcon size={48} className="text-neutral-300" />
          )}
        </div>

        {/* Details */}
        <div className="md:w-1/2 p-6 overflow-y-auto">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-900">
              {idea.title || 'Sans titre'}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg">
              <X size={18} className="text-neutral-500" />
            </button>
          </div>

          <p className="text-[13px] text-neutral-600 leading-relaxed mb-4">{idea.suggestionText}</p>

          {idea.photoTips && (
            <div className="bg-amber-50 rounded-xl p-3 mb-4">
              <p className="text-[12px] font-semibold text-amber-700 mb-1">Conseils photo</p>
              <p className="text-[12px] text-amber-600">{idea.photoTips}</p>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2 mb-4">
            {idea.contentTypes && idea.contentTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {idea.contentTypes.map((type) => (
                  <span key={type} className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${CONTENT_TYPE_COLORS[type]}`}>
                    {CONTENT_TYPE_LABELS[type]}
                  </span>
                ))}
              </div>
            )}
            {idea.thematicCategoryIds && idea.thematicCategoryIds.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {idea.thematicCategoryIds.map((catId) => (
                  <span key={catId} className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-purple-50 text-purple-700">
                    {getCategoryName(catId)}
                  </span>
                ))}
              </div>
            )}
            {idea.restaurantTags && idea.restaurantTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {idea.restaurantTags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-orange-50 text-orange-700">
                    {RESTAURANT_TYPE_LABELS[tag]}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
            <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${idea.isActive ? 'text-green-600' : 'text-neutral-400'}`}>
              <span className={`w-2 h-2 rounded-full ${idea.isActive ? 'bg-green-500' : 'bg-neutral-300'}`} />
              {idea.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${idea.isOptimized ? 'text-green-600' : 'text-amber-500'}`}>
              <Zap size={12} />
              {idea.isOptimized ? 'Optimisé' : 'Non optimisé'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Link
              href={`/admin/ideas/${idea.id}/edit`}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors"
            >
              <Edit size={14} />
              Modifier
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Gallery Card ---

function IdeaGalleryCard({
  idea,
  onToggle,
  onDelete,
  onPreview,
  getCategoryName,
}: {
  idea: ContentIdea
  onToggle: () => void
  onDelete: () => void
  onPreview: () => void
  getCategoryName: (id: number) => string
}) {
  const isVideo = idea.exampleMediaType === 'video'

  return (
    <div className={`bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden group hover:shadow-md transition-all ${!idea.isActive ? 'opacity-50' : ''}`}>
      {/* Media */}
      <div className="aspect-square bg-neutral-100 relative overflow-hidden cursor-pointer" onClick={onPreview}>
        {idea.exampleMediaPath ? (
          isVideo ? (
            <LazyVideo src={`/${idea.exampleMediaPath}`} className="w-full h-full" />
          ) : (
            <img
              src={`/${idea.exampleMediaPath}`}
              alt={idea.title || 'Idée'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={32} className="text-neutral-300" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 size={24} className="text-white drop-shadow-lg" />
          </div>
        </div>

        {/* Optimization badge */}
        {!idea.isOptimized && idea.exampleMediaPath && (
          <div className="absolute top-2 right-2">
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-500 text-white rounded-md flex items-center gap-1">
              <Zap size={10} />
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="text-[13px] font-semibold text-neutral-900 line-clamp-1">
          {idea.title || idea.suggestionText.slice(0, 40) + '...'}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {idea.contentTypes?.slice(0, 2).map((type) => (
            <span key={type} className={`px-1.5 py-0.5 text-[10px] font-medium rounded-md ${CONTENT_TYPE_COLORS[type]}`}>
              {CONTENT_TYPE_LABELS[type]}
            </span>
          ))}
          {idea.thematicCategoryIds?.slice(0, 1).map((catId) => (
            <span key={catId} className="px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-purple-50 text-purple-700">
              {getCategoryName(catId)}
            </span>
          ))}
          {((idea.contentTypes?.length || 0) + (idea.thematicCategoryIds?.length || 0)) > 3 && (
            <span className="px-1.5 py-0.5 text-[10px] text-neutral-400">...</span>
          )}
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-neutral-100">
          <button
            onClick={onToggle}
            className={`p-1 rounded-lg transition-colors ${
              idea.isActive ? 'text-green-600 hover:bg-green-50' : 'text-neutral-400 hover:bg-neutral-50'
            }`}
          >
            {idea.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          </button>
          <div className="flex gap-0.5">
            <Link
              href={`/admin/ideas/${idea.id}/edit`}
              className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit size={14} />
            </Link>
            <button
              onClick={onDelete}
              className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Main Component ---

export default function IdeasIndex({ ideas, categories, filters, optimizationStats }: Props) {
  const { flash } = usePage<{ flash?: { success?: string; warning?: string; info?: string } }>().props
  const [search, setSearch] = useState('')
  const [contentTypeFilter, setContentTypeFilter] = useState(filters.contentType || '')
  const [categoryFilter, setCategoryFilter] = useState(filters.category || '')
  const [optimizing, setOptimizing] = useState(false)
  const [lightboxIdea, setLightboxIdea] = useState<ContentIdea | null>(null)
  const [viewMode, setViewMode] = useState<'gallery' | 'list'>('gallery')
  const [showFilters, setShowFilters] = useState(false)

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      if (search) {
        const s = search.toLowerCase()
        const matchesTitle = idea.title?.toLowerCase().includes(s)
        const matchesText = idea.suggestionText.toLowerCase().includes(s)
        if (!matchesTitle && !matchesText) return false
      }
      return true
    })
  }, [ideas, search])

  const getCategoryName = useCallback((id: number) => {
    const cat = categories.find((c) => c.id === id)
    return cat ? `${cat.icon || ''} ${cat.name}`.trim() : `#${id}`
  }, [categories])

  const handleToggle = (id: number) => {
    router.post(`/admin/ideas/${id}/toggle`, {}, { preserveScroll: true })
  }

  const handleDelete = (id: number) => {
    if (!confirm('Supprimer cette idée ?')) return
    router.delete(`/admin/ideas/${id}`, { preserveScroll: true })
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

  const handleOptimizeAll = () => {
    if (optimizing || optimizationStats.pending === 0) return
    if (!confirm(`Optimiser ${optimizationStats.pending} média(s) non optimisé(s) ?`)) return
    setOptimizing(true)
    router.post('/admin/ideas/optimization/all', {}, {
      preserveScroll: true,
      onFinish: () => setOptimizing(false),
    })
  }

  const hasActiveFilters = contentTypeFilter || categoryFilter

  return (
    <AdminLayout title="Idées de contenu">
      <Head title="Idées de contenu - Admin" />

      {/* Flash Messages */}
      {flash?.success && (
        <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100 text-[13px] font-medium text-green-800">
          {flash.success}
        </div>
      )}
      {flash?.warning && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100 text-[13px] font-medium text-amber-800">
          {flash.warning}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
        <div className="flex items-center gap-3 flex-1 w-full">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une idée..."
              className="w-full pl-9 pr-3 py-2.5 text-[13px] bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] border rounded-xl transition-colors ${
              hasActiveFilters
                ? 'bg-primary/5 border-primary/20 text-primary font-medium'
                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <SlidersHorizontal size={14} />
            Filtres
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Optimization */}
          {optimizationStats.pending > 0 && (
            <button
              onClick={handleOptimizeAll}
              disabled={optimizing}
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {optimizing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {optimizing ? 'Optimisation...' : `Optimiser (${optimizationStats.pending})`}
            </button>
          )}

          {/* View toggle */}
          <div className="flex bg-neutral-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('gallery')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'gallery' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'}`}
            >
              <Grid3X3 size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'}`}
            >
              <List size={14} />
            </button>
          </div>

          <Link
            href="/admin/ideas/create"
            className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <Plus size={14} />
            Nouvelle idée
          </Link>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="mb-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[150px]">
              <label className="block text-[12px] font-medium text-neutral-500 mb-1.5">Type de contenu</label>
              <div className="relative">
                <select
                  value={contentTypeFilter}
                  onChange={(e) => setContentTypeFilter(e.target.value)}
                  className="appearance-none w-full px-3 py-2 text-[13px] bg-white border border-neutral-200 rounded-xl pr-8 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Tous</option>
                  {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            <div className="min-w-[150px]">
              <label className="block text-[12px] font-medium text-neutral-500 mb-1.5">Catégorie</label>
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none w-full px-3 py-2 text-[13px] bg-white border border-neutral-200 rounded-xl pr-8 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Toutes</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className="px-4 py-2 text-[13px] font-medium bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors"
              >
                Appliquer
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-[13px] text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Optimization Bar */}
      {optimizationStats.total > 0 && (
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${(optimizationStats.optimized / optimizationStats.total) * 100}%` }}
            />
          </div>
          <span className="text-[12px] text-neutral-500 shrink-0">
            {optimizationStats.optimized}/{optimizationStats.total} optimisés
          </span>
        </div>
      )}

      {/* Results count */}
      <p className="text-[13px] text-neutral-500 mb-3">{filteredIdeas.length} idée(s)</p>

      {/* Gallery View */}
      {viewMode === 'gallery' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredIdeas.map((idea) => (
            <IdeaGalleryCard
              key={idea.id}
              idea={idea}
              onToggle={() => handleToggle(idea.id)}
              onDelete={() => handleDelete(idea.id)}
              onPreview={() => setLightboxIdea(idea)}
              getCategoryName={getCategoryName}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card padding="none" className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="w-16 px-4 py-3" />
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Idée</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Types</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Catégories</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIdeas.map((idea) => (
                <tr key={idea.id} className={`border-b border-neutral-50 hover:bg-neutral-50/50 ${!idea.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-2">
                    <div
                      className="w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden cursor-pointer"
                      onClick={() => setLightboxIdea(idea)}
                    >
                      {idea.exampleMediaPath ? (
                        <img src={`/${idea.exampleMediaPath}`} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={16} className="text-neutral-300" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <p className="text-[13px] font-medium text-neutral-900 line-clamp-1">
                      {idea.title || idea.suggestionText.slice(0, 50) + '...'}
                    </p>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {idea.contentTypes?.map((type) => (
                        <span key={type} className={`px-1.5 py-0.5 text-[10px] font-medium rounded-md ${CONTENT_TYPE_COLORS[type]}`}>
                          {CONTENT_TYPE_LABELS[type]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {idea.thematicCategoryIds?.slice(0, 2).map((catId) => (
                        <span key={catId} className="px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-purple-50 text-purple-700">
                          {getCategoryName(catId)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${idea.isActive ? 'bg-green-500' : 'bg-neutral-300'}`} />
                      {!idea.isOptimized && idea.exampleMediaPath && (
                        <Zap size={12} className="text-amber-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <button onClick={() => handleToggle(idea.id)} className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg transition-colors">
                        {idea.isActive ? <ToggleRight size={16} className="text-green-600" /> : <ToggleLeft size={16} />}
                      </button>
                      <Link href={`/admin/ideas/${idea.id}/edit`} className="p-1.5 text-neutral-400 hover:text-blue-600 rounded-lg transition-colors">
                        <Edit size={14} />
                      </Link>
                      <button onClick={() => handleDelete(idea.id)} className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Empty State */}
      {filteredIdeas.length === 0 && (
        <div className="text-center py-16">
          <ImageIcon size={40} className="mx-auto text-neutral-300 mb-3" />
          <p className="text-[13px] text-neutral-500 mb-2">Aucune idée trouvée</p>
          <Link href="/admin/ideas/create" className="text-[13px] text-primary font-medium hover:underline">
            Créer une idée
          </Link>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdea && (
        <Lightbox
          idea={lightboxIdea}
          onClose={() => setLightboxIdea(null)}
          getCategoryName={getCategoryName}
        />
      )}
    </AdminLayout>
  )
}

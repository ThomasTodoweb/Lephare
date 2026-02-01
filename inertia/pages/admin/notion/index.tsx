import { Head, router } from '@inertiajs/react'
import { AdminLayout } from '~/components/layout'
import { useState, useRef } from 'react'
import {
  Download,
  Trash2,
  Search,
  X,
  Play,
  Image,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Images,
  Film,
  Camera,
  Smartphone,
  ArrowRight,
} from 'lucide-react'

type ContentType = 'post' | 'story' | 'reel' | 'carousel'
type IdeaStatus = 'pending' | 'reviewed' | 'approved' | 'rejected' | 'converted'

interface NotionIdea {
  id: number
  notionPageId: string
  originalTitle: string
  aiGeneratedTitle: string | null
  displayTitle: string
  contentType: ContentType
  mediaPaths: string[]
  mediaTypes: string[]
  thumbnailPath: string | null
  isCarousel: boolean
  primaryMediaType: string
  clientName: string | null
  status: IdeaStatus
  tags: string[] | null
  createdAt: string
}

interface Stats {
  total: number
  pending: number
  approved: number
  byType: {
    post: number
    carousel: number
    reel: number
    story: number
  }
}

interface Props {
  ideas: NotionIdea[]
  stats: Stats
  isNotionConfigured: boolean
}

const CONTENT_TYPE_CONFIG: Record<ContentType, { label: string; icon: typeof Camera; color: string }> = {
  post: { label: 'Post', icon: Camera, color: 'bg-blue-100 text-blue-700' },
  carousel: { label: 'Carrousel', icon: Images, color: 'bg-purple-100 text-purple-700' },
  reel: { label: 'Reel', icon: Film, color: 'bg-pink-100 text-pink-700' },
  story: { label: 'Story', icon: Smartphone, color: 'bg-orange-100 text-orange-700' },
}

const STATUS_CONFIG: Record<IdeaStatus, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: 'En attente', icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
  reviewed: { label: 'Vu', icon: CheckCircle, color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Approuvé', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejeté', icon: XCircle, color: 'bg-red-100 text-red-700' },
  converted: { label: 'Converti', icon: CheckCircle, color: 'bg-purple-100 text-purple-700' },
}

interface ImportProgress {
  current: number
  total: number
  message: string
  phase: 'fetching' | 'downloading' | 'saving' | 'done' | 'error'
}

export default function NotionIdeasIndex({ ideas, stats, isNotionConfigured }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)

  const filteredIdeas = ideas.filter((idea) => {
    if (statusFilter && idea.status !== statusFilter) return false
    if (typeFilter && idea.contentType !== typeFilter) return false
    if (search) {
      const searchLower = search.toLowerCase()
      const matchesTitle =
        idea.originalTitle.toLowerCase().includes(searchLower) ||
        idea.aiGeneratedTitle?.toLowerCase().includes(searchLower)
      const matchesClient = idea.clientName?.toLowerCase().includes(searchLower)
      if (!matchesTitle && !matchesClient) return false
    }
    return true
  })

  const handleImport = async () => {
    if (!isNotionConfigured) {
      alert('La clé API Notion n\'est pas configurée')
      return
    }

    setIsImporting(true)
    setImportMessage(null)
    setImportProgress({ current: 0, total: 0, message: 'Connexion à Notion...', phase: 'fetching' })

    try {
      const response = await fetch('/admin/notion/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': document.cookie
            .split('; ')
            .find((row) => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1] || '',
        },
        body: JSON.stringify({ generateAiTitles: false, limit: 100 }),
      })

      // Handle Server-Sent Events stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE events (lines ending with \n\n)
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || '' // Keep incomplete last line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              switch (data.type) {
                case 'start':
                  setImportProgress({ current: 0, total: 0, message: data.message, phase: 'fetching' })
                  break
                case 'progress':
                  setImportProgress({
                    current: data.current,
                    total: data.total,
                    message: data.message,
                    phase: 'downloading',
                  })
                  break
                case 'saving':
                case 'db_progress':
                  setImportProgress({
                    current: data.current || 0,
                    total: data.total || 0,
                    message: data.message,
                    phase: 'saving',
                  })
                  break
                case 'complete':
                  setImportProgress({ current: 100, total: 100, message: data.message, phase: 'done' })
                  setImportMessage(data.message)
                  setTimeout(() => {
                    router.reload()
                  }, 1500)
                  break
                case 'error':
                  setImportProgress({ current: 0, total: 0, message: data.error, phase: 'error' })
                  setImportMessage(`Erreur: ${data.error}`)
                  break
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }
    } catch (error) {
      setImportProgress({ current: 0, total: 0, message: 'Erreur de connexion', phase: 'error' })
      setImportMessage('Erreur lors de l\'import')
    } finally {
      setIsImporting(false)
    }
  }

  const handleUpdateStatus = async (id: number, status: IdeaStatus) => {
    try {
      await fetch(`/admin/notion/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': document.cookie
            .split('; ')
            .find((row) => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1] || '',
        },
        body: JSON.stringify({ status }),
      })
      router.reload({ only: ['ideas'] })
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette idée et ses médias ?')) return

    try {
      await fetch(`/admin/notion/${id}`, {
        method: 'DELETE',
        headers: {
          'X-XSRF-TOKEN': document.cookie
            .split('; ')
            .find((row) => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1] || '',
        },
      })
      router.reload()
    } catch (error) {
      console.error('Error deleting idea:', error)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Supprimer ${selectedIds.length} idées et leurs médias ?`)) return

    try {
      await fetch('/admin/notion/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': document.cookie
            .split('; ')
            .find((row) => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1] || '',
        },
        body: JSON.stringify({ ids: selectedIds }),
      })
      setSelectedIds([])
      router.reload()
    } catch (error) {
      console.error('Error bulk deleting:', error)
    }
  }

  const handleBulkStatus = async (status: IdeaStatus) => {
    if (selectedIds.length === 0) return

    try {
      await fetch('/admin/notion/bulk-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': document.cookie
            .split('; ')
            .find((row) => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1] || '',
        },
        body: JSON.stringify({ ids: selectedIds, status }),
      })
      setSelectedIds([])
      router.reload()
    } catch (error) {
      console.error('Error bulk updating status:', error)
    }
  }

  const handleConvert = async (id: number) => {
    try {
      const response = await fetch(`/admin/notion/${id}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': document.cookie
            .split('; ')
            .find((row) => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1] || '',
        },
      })
      const data = await response.json()
      if (data.success) {
        setImportMessage(data.message)
        router.reload()
      } else {
        alert(`Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('Error converting idea:', error)
    }
  }

  const handleBulkConvert = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Convertir ${selectedIds.length} idées en ContentIdeas ?`)) return

    try {
      const response = await fetch('/admin/notion/bulk-convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': document.cookie
            .split('; ')
            .find((row) => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1] || '',
        },
        body: JSON.stringify({ ids: selectedIds }),
      })
      const data = await response.json()
      setImportMessage(data.message)
      setSelectedIds([])
      router.reload()
    } catch (error) {
      console.error('Error bulk converting:', error)
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredIdeas.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredIdeas.map((i) => i.id))
    }
  }

  return (
    <AdminLayout>
      <Head title="Import Notion - Admin" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Import Notion</h1>
            <p className="text-gray-600 mt-1">
              Importez vos idées de contenu depuis Notion
            </p>
          </div>
          <button
            onClick={handleImport}
            disabled={isImporting || !isNotionConfigured}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? (
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Download className="h-5 w-5 mr-2" />
            )}
            {isImporting ? 'Import en cours...' : 'Importer depuis Notion'}
          </button>
        </div>

        {/* Import Progress */}
        {isImporting && importProgress && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4 mb-4">
              <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{importProgress.message}</p>
                {importProgress.phase === 'downloading' && importProgress.total > 0 && (
                  <p className="text-sm text-gray-500">
                    {importProgress.current} / {importProgress.total} pages traitées
                  </p>
                )}
              </div>
            </div>
            {importProgress.total > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    importProgress.phase === 'error' ? 'bg-red-600' :
                    importProgress.phase === 'done' ? 'bg-green-600' : 'bg-blue-600'
                  }`}
                  style={{
                    width: `${Math.min(100, (importProgress.current / importProgress.total) * 100)}%`,
                  }}
                />
              </div>
            )}
            {importProgress.phase === 'downloading' && (
              <p className="text-xs text-gray-400 mt-2">
                Téléchargement des médias en cours... Cela peut prendre plusieurs minutes.
              </p>
            )}
          </div>
        )}

        {/* Import Message (after completion) */}
        {!isImporting && importMessage && (
          <div
            className={`p-4 rounded-lg ${
              importMessage.startsWith('Erreur')
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {importMessage}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard label="Total" value={stats.total} color="bg-gray-100" />
          <StatCard label="En attente" value={stats.pending} color="bg-yellow-100" />
          <StatCard label="Approuvés" value={stats.approved} color="bg-green-100" />
          <StatCard label="Posts" value={stats.byType.post} color="bg-blue-100" />
          <StatCard label="Carrousels" value={stats.byType.carousel} color="bg-purple-100" />
          <StatCard label="Reels" value={stats.byType.reel} color="bg-pink-100" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recherche
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Titre, client..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                {Object.entries(CONTENT_TYPE_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {(statusFilter || typeFilter || search) && (
              <button
                onClick={() => {
                  setStatusFilter('')
                  setTypeFilter('')
                  setSearch('')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 flex flex-wrap items-center gap-4">
            <span className="text-blue-700 font-medium">
              {selectedIds.length} sélectionnée(s)
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkConvert}
                className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center gap-1"
              >
                <ArrowRight className="h-4 w-4" />
                Convertir en Idées
              </button>
              <button
                onClick={() => handleBulkStatus('approved')}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                Approuver
              </button>
              <button
                onClick={() => handleBulkStatus('rejected')}
                className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
              >
                Rejeter
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
            <button
              onClick={() => setSelectedIds([])}
              className="ml-auto text-blue-600 hover:text-blue-700 text-sm"
            >
              Désélectionner
            </button>
          </div>
        )}

        {/* Select All */}
        {filteredIdeas.length > 0 && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedIds.length === filteredIdeas.length}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">
              Tout sélectionner ({filteredIdeas.length})
            </span>
          </div>
        )}

        {/* Ideas Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              isSelected={selectedIds.includes(idea.id)}
              onSelect={() => toggleSelect(idea.id)}
              onUpdateStatus={handleUpdateStatus}
              onDelete={() => handleDelete(idea.id)}
              onConvert={() => handleConvert(idea.id)}
            />
          ))}
        </div>

        {filteredIdeas.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Aucune idée trouvée</p>
            {isNotionConfigured ? (
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-700"
              >
                <Download className="h-4 w-4 mr-1" />
                Importer depuis Notion
              </button>
            ) : (
              <p className="mt-4 text-sm text-orange-600">
                Configurez la clé API Notion (NOTION_API_KEY) pour importer
              </p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className={`${color} rounded-lg p-4`}>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

interface IdeaCardProps {
  idea: NotionIdea
  isSelected: boolean
  onSelect: () => void
  onUpdateStatus: (id: number, status: IdeaStatus) => void
  onDelete: () => void
  onConvert: () => void
}

function IdeaCard({ idea, isSelected, onSelect, onUpdateStatus, onDelete, onConvert }: IdeaCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const isVideo = idea.primaryMediaType === 'video'
  const typeConfig = CONTENT_TYPE_CONFIG[idea.contentType]
  const statusConfig = STATUS_CONFIG[idea.status]
  const TypeIcon = typeConfig.icon

  return (
    <div
      className={`bg-white rounded-lg shadow overflow-hidden transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white/90 shadow"
        />
      </div>

      {/* Media Preview */}
      <div className="aspect-square bg-gray-100 relative">
        {idea.thumbnailPath ? (
          isVideo ? (
            <>
              <video
                ref={videoRef}
                src={`/storage${idea.thumbnailPath}`}
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
                <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                  <Play className="h-6 w-6 text-white ml-1" />
                </div>
              </div>
            </>
          ) : (
            <img
              src={`/storage${idea.thumbnailPath}`}
              alt={idea.displayTitle}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {/* Carousel indicator */}
        {idea.isCarousel && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Images className="h-3 w-3" />
            {idea.mediaPaths.length}
          </div>
        )}

        {/* Status Badge */}
        <div
          className={`absolute bottom-2 right-2 ${statusConfig.color} text-xs px-2 py-1 rounded-full`}
        >
          {statusConfig.label}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 truncate" title={idea.displayTitle}>
          {idea.displayTitle}
        </h3>

        {/* Client */}
        {idea.clientName && (
          <p className="text-sm text-gray-500 truncate">{idea.clientName}</p>
        )}

        {/* Type Badge */}
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${typeConfig.color}`}
          >
            <TypeIcon className="h-3 w-3" />
            {typeConfig.label}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          {/* Status Buttons */}
          <div className="flex gap-1">
            {idea.status !== 'converted' && (
              <button
                onClick={onConvert}
                className="p-1.5 rounded-lg transition-colors text-purple-600 hover:bg-purple-50"
                title="Convertir en Idée de contenu"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => onUpdateStatus(idea.id, 'approved')}
              className={`p-1.5 rounded-lg transition-colors ${
                idea.status === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-400 hover:bg-green-50 hover:text-green-600'
              }`}
              title="Approuver"
            >
              <CheckCircle className="h-5 w-5" />
            </button>
            <button
              onClick={() => onUpdateStatus(idea.id, 'rejected')}
              className={`p-1.5 rounded-lg transition-colors ${
                idea.status === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : 'text-gray-400 hover:bg-red-50 hover:text-red-600'
              }`}
              title="Rejeter"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          {/* Delete */}
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
  )
}

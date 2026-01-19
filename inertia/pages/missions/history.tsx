import { Head, Link } from '@inertiajs/react'
import { useState } from 'react'
import { Card } from '~/components/ui/Card'

interface MediaItem {
  type: 'image' | 'video'
  path: string
  order: number
}

interface Publication {
  id: number
  contentType: 'post' | 'carousel' | 'reel' | 'story'
  imagePath: string
  mediaItems: MediaItem[]
  status: 'draft' | 'pending' | 'published' | 'failed' | 'deleted'
  instagramPostId: string | null
  publishedAt: string | null
}

interface MissionHistory {
  id: number
  status: 'pending' | 'completed' | 'skipped'
  assignedAt: string
  completedAt: string | null
  template: {
    type: 'post' | 'story' | 'reel' | 'tuto' | 'carousel'
    title: string
  }
  publication: Publication | null
}

interface Props {
  missions: MissionHistory[]
}

const TYPE_ICONS: Record<string, string> = {
  post: '📸',
  carousel: '🖼️',
  story: '📱',
  reel: '🎬',
  tuto: '🎓',
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  post: 'Post',
  carousel: 'Carrousel',
  reel: 'Reel',
  story: 'Story',
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Complétée' },
  skipped: { bg: 'bg-neutral-100', text: 'text-neutral-600', label: 'Passée' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En cours' },
}

const PUB_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  published: { bg: 'bg-green-100', text: 'text-green-700', label: 'Publié' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En attente' },
  failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Échec' },
  draft: { bg: 'bg-neutral-100', text: 'text-neutral-600', label: 'Brouillon' },
  deleted: { bg: 'bg-neutral-100', text: 'text-neutral-600', label: 'Supprimé' },
}

export default function MissionHistory({ missions }: Props) {
  const [expandedMission, setExpandedMission] = useState<number | null>(null)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getMediaPreview = (publication: Publication) => {
    if (publication.mediaItems && publication.mediaItems.length > 0) {
      return publication.mediaItems[0]
    }
    return { type: 'image' as const, path: publication.imagePath, order: 0 }
  }

  const toggleExpand = (missionId: number) => {
    setExpandedMission(expandedMission === missionId ? null : missionId)
  }

  return (
    <>
      <Head title="Historique missions - Le Phare" />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/missions" className="text-primary">
              ← Retour
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Historique
          </h1>
          <p className="text-neutral-600 mt-2">
            Vos missions passées
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-8">
          {missions.length > 0 ? (
            <div className="space-y-4">
              {missions.map((mission) => {
                const style = STATUS_STYLES[mission.status]
                const isExpanded = expandedMission === mission.id
                const hasPublication = mission.publication !== null

                return (
                  <Card key={mission.id} className="!p-0 overflow-hidden">
                    {/* Main row - always visible */}
                    <div
                      className={`p-4 ${hasPublication ? 'cursor-pointer' : ''}`}
                      onClick={() => hasPublication && toggleExpand(mission.id)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Icon or thumbnail */}
                        {hasPublication && mission.publication ? (
                          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border-2 border-neutral-200">
                            {getMediaPreview(mission.publication).type === 'video' ? (
                              <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                                <span className="text-xl">🎬</span>
                              </div>
                            ) : (
                              <img
                                src={`/${getMediaPreview(mission.publication).path}`}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                            {TYPE_ICONS[mission.template.type] || '📋'}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-neutral-900 text-sm truncate">
                            {mission.template.title}
                          </h3>
                          <p className="text-xs text-neutral-500">
                            {formatDate(mission.assignedAt)}
                          </p>
                          {hasPublication && mission.publication && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-neutral-600">
                                {CONTENT_TYPE_LABELS[mission.publication.contentType] || 'Post'}
                              </span>
                              {mission.publication.mediaItems && mission.publication.mediaItems.length > 1 && (
                                <span className="text-xs text-neutral-500">
                                  ({mission.publication.mediaItems.length} médias)
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${style.bg} ${style.text}`}>
                            {style.label}
                          </span>
                          {hasPublication && mission.publication && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${PUB_STATUS_STYLES[mission.publication.status]?.bg || 'bg-neutral-100'} ${PUB_STATUS_STYLES[mission.publication.status]?.text || 'text-neutral-600'}`}>
                              {PUB_STATUS_STYLES[mission.publication.status]?.label || mission.publication.status}
                            </span>
                          )}
                        </div>

                        {/* Expand indicator */}
                        {hasPublication && (
                          <span className={`text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expanded content - publication preview */}
                    {isExpanded && mission.publication && (
                      <div className="border-t border-neutral-200 p-4 bg-neutral-50">
                        {/* Media preview */}
                        <div className="mb-4">
                          {mission.publication.contentType === 'carousel' && mission.publication.mediaItems.length > 0 ? (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {mission.publication.mediaItems.map((item, idx) => (
                                <div key={idx} className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-neutral-200">
                                  {item.type === 'video' ? (
                                    <video
                                      src={`/${item.path}`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <img
                                      src={`/${item.path}`}
                                      alt={`Image ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : mission.publication.contentType === 'reel' || getMediaPreview(mission.publication).type === 'video' ? (
                            <video
                              src={`/${getMediaPreview(mission.publication).path}`}
                              className="w-full max-h-48 object-contain rounded-lg bg-black"
                              controls
                            />
                          ) : (
                            <img
                              src={`/${mission.publication.imagePath}`}
                              alt="Publication"
                              className="w-full max-h-48 object-contain rounded-lg bg-neutral-100"
                            />
                          )}
                        </div>

                        {/* Publication info */}
                        <div className="space-y-2">
                          {mission.publication.publishedAt && (
                            <p className="text-sm text-neutral-600">
                              <span className="font-medium">Publié le:</span>{' '}
                              {formatDateTime(mission.publication.publishedAt)}
                            </p>
                          )}

                          {mission.publication.instagramPostId && (
                            <a
                              href={`https://www.instagram.com/p/${mission.publication.instagramPostId}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-primary font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>📲</span>
                              Voir sur Instagram
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">📋</span>
              </div>
              <h2 className="text-lg font-bold text-neutral-900 mb-2">
                Aucune mission
              </h2>
              <p className="text-neutral-600 text-center text-sm">
                Vos missions apparaîtront ici une fois que vous en aurez complété.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

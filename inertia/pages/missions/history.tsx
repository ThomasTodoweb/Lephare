import { Head, Link } from '@inertiajs/react'
import { useState } from 'react'
import { ChevronLeft, ChevronDown } from 'lucide-react'
import { AppLayout } from '~/components/layout'
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

const TYPE_LABELS: Record<string, string> = {
  post: 'Post',
  carousel: 'Carrousel',
  story: 'Story',
  reel: 'Reel',
  tuto: 'Tuto',
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  post: 'Post',
  carousel: 'Carrousel',
  reel: 'Reel',
  story: 'Story',
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Complétée' },
  skipped: { bg: 'bg-bg-subtle', text: 'text-text-muted', label: 'Passée' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'En cours' },
}

const PUB_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  published: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Publié' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'En attente' },
  failed: { bg: 'bg-red-50', text: 'text-red-600', label: 'Échec' },
  draft: { bg: 'bg-bg-subtle', text: 'text-text-muted', label: 'Brouillon' },
  deleted: { bg: 'bg-bg-subtle', text: 'text-text-muted', label: 'Supprimé' },
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
    <AppLayout>
      <Head title="Historique missions - Le Phare" />

      <div className="pt-4 pb-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/missions" className="inline-flex items-center gap-1 text-[13px] text-text-secondary mb-3">
            <ChevronLeft className="w-4 h-4" />
            Missions
          </Link>
          <h1 className="text-[22px] font-bold text-text">Historique</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Vos missions passées
          </p>
        </div>

        {/* Content */}
        {missions.length > 0 ? (
          <div className="flex flex-col gap-2">
            {missions.map((mission) => {
              const style = STATUS_STYLES[mission.status]
              const isExpanded = expandedMission === mission.id
              const hasPublication = mission.publication !== null

              return (
                <Card key={mission.id} padding="none" className="overflow-hidden">
                  {/* Main row - always visible */}
                  <div
                    className={`p-4 ${hasPublication ? 'cursor-pointer' : ''}`}
                    onClick={() => hasPublication && toggleExpand(mission.id)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon or thumbnail */}
                      {hasPublication && mission.publication ? (
                        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-border">
                          {getMediaPreview(mission.publication).type === 'video' ? (
                            <div className="w-full h-full bg-bg-subtle flex items-center justify-center">
                              <span className="text-[14px] text-text-muted">▶</span>
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
                        <div className="w-11 h-11 bg-bg-subtle rounded-xl flex items-center justify-center text-[13px] text-text-muted shrink-0">
                          {TYPE_LABELS[mission.template.type]?.[0] || 'M'}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="text-[14px] font-semibold text-text truncate">
                          {mission.template.title}
                        </h3>
                        <p className="text-[12px] text-text-muted">
                          {formatDate(mission.assignedAt)}
                        </p>
                        {hasPublication && mission.publication && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-text-muted">
                              {CONTENT_TYPE_LABELS[mission.publication.contentType] || 'Post'}
                            </span>
                            {mission.publication.mediaItems && mission.publication.mediaItems.length > 1 && (
                              <span className="text-[11px] text-text-muted">
                                ({mission.publication.mediaItems.length} médias)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                        {hasPublication && mission.publication && (
                          <span className={`text-[11px] px-2 py-0.5 rounded-lg ${PUB_STATUS_STYLES[mission.publication.status]?.bg || 'bg-bg-subtle'} ${PUB_STATUS_STYLES[mission.publication.status]?.text || 'text-text-muted'}`}>
                            {PUB_STATUS_STYLES[mission.publication.status]?.label || mission.publication.status}
                          </span>
                        )}
                      </div>

                      {/* Expand indicator */}
                      {hasPublication && (
                        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </div>

                  {/* Expanded content - publication preview */}
                  {isExpanded && mission.publication && (
                    <div className="border-t border-border p-4 bg-bg-subtle">
                      {/* Media preview */}
                      <div className="mb-3">
                        {mission.publication.contentType === 'carousel' && mission.publication.mediaItems.length > 0 ? (
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {mission.publication.mediaItems.map((item, idx) => (
                              <div key={idx} className="shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-border">
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
                            className="w-full max-h-48 object-contain rounded-xl bg-black"
                            controls
                          />
                        ) : (
                          <img
                            src={`/${mission.publication.imagePath}`}
                            alt="Publication"
                            className="w-full max-h-48 object-contain rounded-xl bg-bg-subtle"
                          />
                        )}
                      </div>

                      {/* Publication info */}
                      <div className="space-y-2">
                        {mission.publication.publishedAt && (
                          <p className="text-[13px] text-text-secondary">
                            <span className="font-medium">Publié le</span>{' '}
                            {formatDateTime(mission.publication.publishedAt)}
                          </p>
                        )}

                        {mission.publication.instagramPostId && (
                          <a
                            href={`https://www.instagram.com/p/${mission.publication.instagramPostId}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary font-medium underline"
                            onClick={(e) => e.stopPropagation()}
                          >
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
          <div className="text-center py-16">
            <p className="text-[15px] font-medium text-text mb-1">
              Aucune mission
            </p>
            <p className="text-[13px] text-text-muted">
              Vos missions apparaîtront ici une fois complétées
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

import { Head, Link, useForm } from '@inertiajs/react'
import { ChevronLeft, ChevronRight, Star, Gift, Sparkles, Check } from 'lucide-react'
import { AppLayout } from '~/components/layout'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { Badge } from '~/components/ui/Badge'
import { MissionTypeIcon } from '~/components/ui/mobile/MissionTypeIcon'
import type { MissionType } from '~/components/ui/mobile/MissionTypeIcon'

interface MissionTemplate {
  type: 'post' | 'story' | 'reel' | 'tuto' | 'engagement'
  title: string
  contentIdea: string
}

interface Mission {
  id: number
  status: 'pending' | 'completed' | 'skipped'
  slotNumber: number
  isRecommended: boolean
  template: MissionTemplate
}

interface Props {
  mission: Mission | null
  todayMissions?: Mission[]
}

// Icons now rendered via MissionTypeIcon component

const TYPE_LABELS: Record<string, string> = {
  post: 'Photo', story: 'Story', reel: 'Vidéo courte', tuto: 'Tutoriel', engagement: 'Interactions',
}

export default function TodayMission({ mission, todayMissions = [] }: Props) {
  const acceptForm = useForm({})

  const handleAccept = () => {
    if (mission) acceptForm.post(`/missions/${mission.id}/accept`)
  }

  const sortedMissions = [...todayMissions].sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1
    if (!a.isRecommended && b.isRecommended) return 1
    return 0
  })

  const currentIndex = mission ? sortedMissions.findIndex(m => m.id === mission.id) : -1
  const prevMission = currentIndex > 0 ? sortedMissions[currentIndex - 1] : null
  const nextMission = currentIndex < sortedMissions.length - 1 ? sortedMissions[currentIndex + 1] : null
  const isRequired = mission?.isRecommended

  return (
    <AppLayout>
      <Head title="Ma mission - Le Phare" />

      <div className="pb-4 animate-fade-up">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            {isRequired ? 'Objectif du jour' : 'Mission bonus'}
          </p>
          {sortedMissions.length > 1 && mission && (
            <span className="text-[12px] font-medium text-text-muted">
              {currentIndex + 1}/{sortedMissions.length}
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      {sortedMissions.length > 1 && (
        <div className="flex justify-between items-center mb-4">
          {prevMission ? (
            <Link href={`/missions/${prevMission.id}`} className="flex items-center gap-1 text-text-secondary text-[13px] font-medium min-h-[44px] active:scale-[0.97] transition-transform">
              <ChevronLeft className="w-4 h-4" />
              {prevMission.isRecommended ? 'Objectif' : 'Bonus'}
            </Link>
          ) : <div />}
          {nextMission ? (
            <Link href={`/missions/${nextMission.id}`} className="flex items-center gap-1 text-text-secondary text-[13px] font-medium min-h-[44px] active:scale-[0.97] transition-transform">
              {nextMission.isRecommended ? 'Objectif' : 'Bonus'}
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : <div />}
        </div>
      )}

      <div className="pb-32 space-y-6">
        {mission ? (
          <>
            {/* Mission Card */}
            <div className="bg-bg-card border border-border rounded-2xl p-5 animate-fade-up">
              <div className="flex items-start gap-3.5">
                <div className={`w-12 h-12 ${isRequired ? 'bg-primary text-white' : 'bg-bg-subtle text-text-secondary'} rounded-xl flex items-center justify-center`}>
                  <MissionTypeIcon type={mission.template.type as MissionType} size={22} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={isRequired ? 'primary' : 'default'}>
                      {isRequired ? 'Objectif' : 'Bonus'}
                    </Badge>
                    <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                      {TYPE_LABELS[mission.template.type]}
                    </span>
                  </div>
                  <h2 className="text-[17px] font-bold text-text leading-snug">
                    {mission.template.title}
                  </h2>
                </div>
              </div>
            </div>

            {/* Content Idea */}
            <div className="bg-bg-subtle border border-border rounded-2xl p-4 animate-fade-up" style={{ animationDelay: '50ms' }}>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">L'idée</p>
              <p className="text-[14px] text-text leading-relaxed">{mission.template.contentIdea}</p>
            </div>

            {/* Other missions */}
            {sortedMissions.length > 1 && (
              <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                  {isRequired ? 'Missions bonus' : 'Retour à l\'objectif'}
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {sortedMissions.filter(m => m.id !== mission.id).map(m => (
                    <Link
                      key={m.id}
                      href={`/missions/${m.id}`}
                      className={`
                        flex-shrink-0 px-3 py-2.5 rounded-xl border transition-all active:scale-[0.97]
                        ${m.status === 'completed'
                          ? 'border-success/30 bg-success/10'
                          : 'border-border bg-bg-card hover:bg-bg-subtle'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <MissionTypeIcon type={m.template.type as MissionType} size={18} />
                        <div>
                          <p className="text-[11px] font-medium text-text-muted">
                            {m.isRecommended ? 'Objectif' : 'Bonus'}
                          </p>
                          <p className="text-[13px] font-semibold text-text truncate max-w-[120px]">{m.template.title}</p>
                        </div>
                        {m.status === 'completed' && <Check className="w-4 h-4 text-success" />}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-up">
            <div className="w-12 h-12 bg-bg-subtle border border-border rounded-2xl flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-text-muted" />
            </div>
            <h2 className="text-[17px] font-bold text-text mb-1">Pas de mission aujourd'hui</h2>
            <p className="text-[13px] text-text-muted text-center">
              Repose-toi ! Ta prochaine mission arrive bientôt.
            </p>
          </div>
        )}
      </div>

      {/* Fixed bottom buttons */}
      {mission && mission.status === 'pending' && (
        <div className="fixed bottom-20 left-0 right-0 p-5 bg-bg/80 backdrop-blur-xl border-t border-border">
          <div className="flex items-center gap-2">
            <Button onClick={handleAccept} disabled={acceptForm.processing} variant="primary" fullWidth size="lg">
              {acceptForm.processing ? 'Chargement...' : "C'est parti !"}
            </Button>
            <span className="text-[11px] text-text-muted ml-2">+10 points</span>
          </div>
        </div>
      )}

      {mission && mission.status === 'completed' && (
        <div className="fixed bottom-20 left-0 right-0 p-5 bg-bg/80 backdrop-blur-xl border-t border-border">
          <div className="bg-success/10 border border-success/20 text-success rounded-2xl p-3.5 text-center text-[14px] font-medium flex items-center justify-center gap-1.5">
            Mission accomplie <Check className="w-4 h-4" />
          </div>
        </div>
      )}

      {mission && mission.status === 'skipped' && (
        <div className="fixed bottom-20 left-0 right-0 p-5 bg-bg/80 backdrop-blur-xl border-t border-border">
          <div className="bg-bg-subtle border border-border text-text-muted rounded-2xl p-3.5 text-center text-[14px] font-medium">
            Mission passée
          </div>
        </div>
      )}
    </AppLayout>
  )
}

import { Head, Link, useForm } from '@inertiajs/react'
import { ChevronLeft, ChevronRight, Star, Gift } from 'lucide-react'
import { AppLayout } from '~/components/layout'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { Badge } from '~/components/ui/Badge'

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

const TYPE_ICONS: Record<string, string> = {
  post: '📸', story: '📱', reel: '🎬', tuto: '🎓', engagement: '💬',
}

const TYPE_LABELS: Record<string, string> = {
  post: 'Post', story: 'Story', reel: 'Réel', tuto: 'Tutoriel', engagement: 'Engagement',
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

      <div className="pb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[13px] text-text-muted font-medium">
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
            <Link href={`/missions/${prevMission.id}`} className="flex items-center gap-1 text-text-secondary text-[13px] font-medium">
              <ChevronLeft className="w-4 h-4" />
              {prevMission.isRecommended ? 'Objectif' : 'Bonus'}
            </Link>
          ) : <div />}
          {nextMission ? (
            <Link href={`/missions/${nextMission.id}`} className="flex items-center gap-1 text-text-secondary text-[13px] font-medium">
              {nextMission.isRecommended ? 'Objectif' : 'Bonus'}
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : <div />}
        </div>
      )}

      <div className="pb-32">
        {mission ? (
          <>
            {/* Mission Card */}
            <Card variant="bordered" padding="lg" className="mb-4">
              <div className="flex items-start gap-3.5">
                <div className={`w-12 h-12 ${isRequired ? 'bg-text' : 'bg-bg-subtle'} rounded-xl flex items-center justify-center text-xl`}>
                  {TYPE_ICONS[mission.template.type]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={isRequired ? 'primary' : 'default'}>
                      {isRequired ? 'Objectif' : 'Bonus'}
                    </Badge>
                    <span className="text-[11px] font-medium text-text-muted uppercase">
                      {TYPE_LABELS[mission.template.type]}
                    </span>
                  </div>
                  <h2 className="text-[17px] font-bold text-text leading-snug">
                    {mission.template.title}
                  </h2>
                </div>
              </div>
            </Card>

            {/* Content Idea */}
            <Card variant="flat" padding="md" className="mb-4">
              <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">L'idée</p>
              <p className="text-[14px] text-text leading-relaxed">{mission.template.contentIdea}</p>
            </Card>

            {/* Other missions */}
            {sortedMissions.length > 1 && (
              <div className="mb-4">
                <p className="text-[12px] font-medium text-text-muted mb-2">
                  {isRequired ? 'Missions bonus' : 'Retour à l\'objectif'}
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {sortedMissions.filter(m => m.id !== mission.id).map(m => (
                    <Link
                      key={m.id}
                      href={`/missions/${m.id}`}
                      className={`
                        flex-shrink-0 px-3 py-2.5 rounded-xl border transition-colors
                        ${m.status === 'completed'
                          ? 'border-green-200 bg-green-50'
                          : 'border-border bg-bg-card hover:bg-bg-subtle'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{TYPE_ICONS[m.template.type]}</span>
                        <div>
                          <p className="text-[11px] font-medium text-text-muted">
                            {m.isRecommended ? 'Objectif' : 'Bonus'}
                          </p>
                          <p className="text-[13px] font-semibold text-text truncate max-w-[120px]">{m.template.title}</p>
                        </div>
                        {m.status === 'completed' && <span className="text-green-600 text-sm">✓</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-3xl mb-3">✨</p>
            <h2 className="text-[17px] font-bold text-text mb-1">Pas de mission aujourd'hui</h2>
            <p className="text-[13px] text-text-muted text-center">
              Reposez-vous ! Votre prochaine mission arrive bientôt.
            </p>
          </div>
        )}
      </div>

      {/* Fixed bottom buttons */}
      {mission && mission.status === 'pending' && (
        <div className="fixed bottom-20 left-0 right-0 p-5 bg-bg/80 backdrop-blur-lg">
          <Button onClick={handleAccept} disabled={acceptForm.processing} variant="primary" fullWidth size="lg">
            {acceptForm.processing ? 'Chargement...' : "C'est parti !"}
          </Button>
        </div>
      )}

      {mission && mission.status === 'completed' && (
        <div className="fixed bottom-20 left-0 right-0 p-5 bg-bg/80 backdrop-blur-lg">
          <div className="bg-green-50 text-green-700 rounded-xl p-3.5 text-center text-[14px] font-medium">
            Mission accomplie ✓
          </div>
        </div>
      )}

      {mission && mission.status === 'skipped' && (
        <div className="fixed bottom-20 left-0 right-0 p-5 bg-bg/80 backdrop-blur-lg">
          <div className="bg-bg-subtle text-text-muted rounded-xl p-3.5 text-center text-[14px] font-medium">
            Mission passée
          </div>
        </div>
      )}
    </AppLayout>
  )
}

import { Head, Link, useForm } from '@inertiajs/react'
import { ChevronLeft, ChevronRight, Star, Gift } from 'lucide-react'
import { AppLayout } from '~/components/layout'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'

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
  post: '📸',
  story: '📱',
  reel: '🎬',
  tuto: '🎓',
  engagement: '💬',
}

const TYPE_LABELS: Record<string, string> = {
  post: 'Post',
  story: 'Story',
  reel: 'Réel',
  tuto: 'Tutoriel',
  engagement: 'Engagement',
}

export default function TodayMission({ mission, todayMissions = [] }: Props) {
  const acceptForm = useForm({})

  const handleAccept = () => {
    if (mission) {
      acceptForm.post(`/missions/${mission.id}/accept`)
    }
  }

  // Sort missions: required first
  const sortedMissions = [...todayMissions].sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1
    if (!a.isRecommended && b.isRecommended) return 1
    return 0
  })

  // Find current mission index and prev/next missions
  const currentIndex = mission ? sortedMissions.findIndex(m => m.id === mission.id) : -1
  const prevMission = currentIndex > 0 ? sortedMissions[currentIndex - 1] : null
  const nextMission = currentIndex < sortedMissions.length - 1 ? sortedMissions[currentIndex + 1] : null

  // isRecommended = mission obligatoire
  const isRequired = mission?.isRecommended

  return (
    <AppLayout>
      <Head title="Ma mission - Le Phare" />
      {/* Header with navigation */}
      <div className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            {isRequired ? 'Objectif du jour' : 'Mission bonus'}
          </h1>
          {/* Navigation counter */}
          {sortedMissions.length > 1 && mission && (
            <span className="text-sm font-medium text-neutral-500">
              {currentIndex + 1} / {sortedMissions.length}
            </span>
          )}
        </div>
        <p className="text-neutral-600">
          {isRequired ? 'Votre défi du jour !' : 'Mission optionnelle pour aller plus loin'}
        </p>
      </div>

      {/* Mission navigation arrows */}
      {sortedMissions.length > 1 && (
        <div className="flex justify-between items-center mb-4">
          {prevMission ? (
            <Link
              href={`/missions/${prevMission.id}`}
              className="flex items-center gap-1 text-primary font-medium text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              {prevMission.isRecommended ? 'Objectif' : 'Bonus'}
            </Link>
          ) : (
            <div />
          )}
          {nextMission ? (
            <Link
              href={`/missions/${nextMission.id}`}
              className="flex items-center gap-1 text-primary font-medium text-sm"
            >
              {nextMission.isRecommended ? 'Objectif' : 'Bonus'}
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      )}

      {/* Content */}
      <div className="pb-32">
          {mission ? (
            <>
              {/* Mission Card */}
              <Card className={`mb-6 ${!isRequired ? 'border-2 border-neutral-200' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 ${isRequired ? 'bg-primary' : 'bg-neutral-500'} rounded-2xl flex items-center justify-center text-2xl`}>
                    {TYPE_ICONS[mission.template.type]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase ${isRequired ? 'text-primary' : 'text-neutral-500'}`}>
                        {TYPE_LABELS[mission.template.type]}
                      </span>
                      {isRequired ? (
                        <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                          <Star className="w-3 h-3 fill-current" />
                          Objectif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-600 text-xs px-2 py-0.5 rounded-full font-medium">
                          <Gift className="w-3 h-3" />
                          Bonus
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-neutral-900">
                      {mission.template.title}
                    </h2>
                  </div>
                </div>
              </Card>

              {/* Content Idea */}
              <Card className="mb-6 bg-neutral-50">
                <h3 className="font-bold text-neutral-900 mb-2">L'idée</h3>
                <p className="text-neutral-700">{mission.template.contentIdea}</p>
              </Card>

              {/* Other missions preview */}
              {sortedMissions.length > 1 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-neutral-500 mb-3">
                    {isRequired ? 'Missions bonus disponibles' : 'Retour à l\'objectif'}
                  </h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {sortedMissions.filter(m => m.id !== mission.id).map(m => (
                      <Link
                        key={m.id}
                        href={`/missions/${m.id}`}
                        className={`
                          flex-shrink-0 px-4 py-3 rounded-xl border-2 transition-colors
                          ${m.status === 'completed'
                            ? 'border-green-500 bg-green-50'
                            : m.isRecommended
                              ? 'border-primary bg-primary/5 hover:bg-primary/10'
                              : 'border-neutral-200 bg-white hover:border-neutral-300'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{TYPE_ICONS[m.template.type]}</span>
                          <div>
                            <p className={`text-xs font-medium ${m.isRecommended ? 'text-primary' : 'text-neutral-500'}`}>
                              {m.isRecommended ? 'Objectif' : 'Bonus'}
                            </p>
                            <p className="text-sm font-bold text-neutral-900 truncate max-w-[120px]">{m.template.title}</p>
                          </div>
                          {m.status === 'completed' && (
                            <span className="text-green-600 ml-1">✓</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* No mission state */
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-32 h-32 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-5xl">😴</span>
              </div>
              <h2 className="text-xl font-bold text-neutral-900 mb-2">
                Pas de mission aujourd'hui
              </h2>
              <p className="text-neutral-600 text-center">
                Reposez-vous ! Votre prochaine mission arrive bientôt selon votre rythme choisi.
              </p>
            </div>
          )}
        </div>

      {/* Fixed bottom buttons */}
      {mission && mission.status === 'pending' && (
        <div className="fixed bottom-20 left-0 right-0 p-6 bg-background border-t border-neutral-200 space-y-3">
          <Button
            onClick={handleAccept}
            disabled={acceptForm.processing}
            className="w-full"
          >
            {acceptForm.processing ? 'Chargement...' : "C'est parti !"}
          </Button>
        </div>
      )}

      {mission && mission.status === 'completed' && (
        <div className="fixed bottom-20 left-0 right-0 p-6 bg-background border-t border-neutral-200">
          <div className="bg-green-100 text-green-800 rounded-xl p-4 text-center">
            <p className="font-bold">Mission accomplie !</p>
          </div>
        </div>
      )}

      {mission && mission.status === 'skipped' && (
        <div className="fixed bottom-20 left-0 right-0 p-6 bg-background border-t border-neutral-200">
          <div className="bg-neutral-100 text-neutral-600 rounded-xl p-4 text-center">
            <p className="font-medium">Mission passée</p>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

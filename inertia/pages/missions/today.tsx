import { Head, useForm } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'

interface MissionTemplate {
  type: 'post' | 'story' | 'reel' | 'tuto'
  title: string
  contentIdea: string
}

interface Mission {
  id: number
  status: 'pending' | 'completed' | 'skipped'
  canUseAction: boolean
  usedPass: boolean
  usedReload: boolean
  template: MissionTemplate
}

interface Props {
  mission: Mission | null
}

const TYPE_ICONS: Record<string, string> = {
  post: '📸',
  story: '📱',
  reel: '🎬',
  tuto: '🎓',
}

const TYPE_LABELS: Record<string, string> = {
  post: 'Post',
  story: 'Story',
  reel: 'Réel',
  tuto: 'Tutoriel',
}

export default function TodayMission({ mission }: Props) {
  const acceptForm = useForm({})
  const skipForm = useForm({})
  const reloadForm = useForm({})

  const handleAccept = () => {
    if (mission) {
      acceptForm.post(`/missions/${mission.id}/accept`)
    }
  }

  const handleSkip = () => {
    if (mission) {
      skipForm.post(`/missions/${mission.id}/skip`)
    }
  }

  const handleReload = () => {
    if (mission) {
      reloadForm.post(`/missions/${mission.id}/reload`)
    }
  }

  return (
    <>
      <Head title="Ma mission - Le Phare" />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Mission du jour
          </h1>
          <p className="text-neutral-600 mt-2">
            Votre défi créatif vous attend !
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pb-32">
          {mission ? (
            <>
              {/* Mission Card */}
              <Card className="mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-2xl">
                    {TYPE_ICONS[mission.template.type]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary uppercase">
                        {TYPE_LABELS[mission.template.type]}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-neutral-900">
                      {mission.template.title}
                    </h2>
                  </div>
                </div>
              </Card>

              {/* Content Idea */}
              <Card className="mb-6 bg-neutral-50">
                <h3 className="font-bold text-neutral-900 mb-2">💡 L'idée</h3>
                <p className="text-neutral-700">{mission.template.contentIdea}</p>
              </Card>

              {/* Illustration placeholder */}
              <div className="flex justify-center mb-6">
                <div className="w-48 h-48 bg-neutral-100 rounded-full flex items-center justify-center">
                  <span className="text-6xl">👨‍🍳</span>
                </div>
              </div>

              {/* Status indicator for used actions */}
              {(mission.usedPass || mission.usedReload) && (
                <div className="text-center text-sm text-neutral-500 mb-4">
                  {mission.usedPass && '✓ Pass utilisé aujourd\'hui'}
                  {mission.usedReload && '✓ Rechargement utilisé aujourd\'hui'}
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
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t border-neutral-200 space-y-3">
            <Button
              onClick={handleAccept}
              disabled={acceptForm.processing}
              className="w-full"
            >
              {acceptForm.processing ? 'Chargement...' : "C'est parti !"}
            </Button>

            {mission.canUseAction && (
              <div className="flex gap-3">
                <Button
                  variant="outlined"
                  onClick={handleSkip}
                  disabled={skipForm.processing}
                  className="flex-1"
                >
                  {skipForm.processing ? '...' : 'Passer'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleReload}
                  disabled={reloadForm.processing}
                  className="flex-1"
                >
                  {reloadForm.processing ? '...' : 'Autre mission'}
                </Button>
              </div>
            )}
          </div>
        )}

        {mission && mission.status === 'completed' && (
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t border-neutral-200">
            <div className="bg-green-100 text-green-800 rounded-xl p-4 text-center">
              <span className="text-2xl mb-2 block">🎉</span>
              <p className="font-bold">Mission accomplie !</p>
            </div>
          </div>
        )}

        {mission && mission.status === 'skipped' && (
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t border-neutral-200">
            <div className="bg-neutral-100 text-neutral-600 rounded-xl p-4 text-center">
              <p className="font-medium">Mission passée. À demain !</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

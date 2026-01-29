import { Check, Camera, Smartphone, Film, BookOpen, MessageCircle, Images } from 'lucide-react'
import { Heading } from '~/components/ui'

export interface MissionCardProps {
  mission: {
    id: number
    title: string
    description: string
    coverImageUrl: string
    type?: 'post' | 'story' | 'reel' | 'tuto' | 'engagement' | 'carousel'
    status?: 'pending' | 'completed' | 'skipped'
    isRecommended?: boolean
  }
  onStart: () => void
  isActive?: boolean
}

// Map mission type to icon and label
const missionTypeConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  post: { icon: <Camera className="w-5 h-5" />, label: 'Post' },
  story: { icon: <Smartphone className="w-5 h-5" />, label: 'Story' },
  reel: { icon: <Film className="w-5 h-5" />, label: 'Reel' },
  tuto: { icon: <BookOpen className="w-5 h-5" />, label: 'Tutoriel' },
  engagement: { icon: <MessageCircle className="w-5 h-5" />, label: 'Engagement' },
  carousel: { icon: <Images className="w-5 h-5" />, label: 'Carrousel' },
}

export function MissionCard({ mission, onStart, isActive = true }: MissionCardProps) {
  const isCompleted = mission.status === 'completed'
  const isSkipped = mission.status === 'skipped'
  const typeConfig = missionTypeConfig[mission.type || 'post'] || missionTypeConfig.post

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        transition-all duration-300 ease-out
        ${isCompleted ? 'ring-4 ring-green-500' : 'ring-2 ring-neutral-200'}
        ${isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-80'}
        w-full min-h-[380px]
      `}
    >
      {/* Image de fond */}
      <img
        src={mission.coverImageUrl}
        alt={mission.title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay gradient */}
      <div className={`absolute inset-0 ${isCompleted ? 'bg-black/50' : 'bg-gradient-to-t from-black/90 via-black/40 to-black/20'}`} />

      {/* Statut en haut */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        {/* Type de contenu */}
        <div className="bg-white/95 backdrop-blur-sm text-neutral-900 px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg">
          {typeConfig.icon}
          <span className="font-semibold text-sm">{typeConfig.label}</span>
        </div>

        {/* Indicateur de statut */}
        {isCompleted ? (
          <div className="bg-green-500 text-white px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg">
            <Check className="w-4 h-4" />
            <span className="font-semibold text-sm">Fait !</span>
          </div>
        ) : isSkipped ? (
          <div className="bg-neutral-500 text-white px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg">
            <span className="font-semibold text-sm">Passe</span>
          </div>
        ) : (
          <div className="bg-primary text-white px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg">
            <span className="font-semibold text-sm">A faire</span>
          </div>
        )}
      </div>

      {/* Contenu en bas */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <Heading level={2} className="text-white mb-2 text-xl font-bold drop-shadow-lg">
          {mission.title}
        </Heading>
        <p className="text-white/90 text-sm mb-5 line-clamp-2 drop-shadow-md">
          {mission.description}
        </p>
        <button
          type="button"
          onClick={onStart}
          className={`
            w-full rounded-xl px-6 py-4 font-bold text-base tracking-wide transition-all
            shadow-lg active:scale-[0.98]
            ${isCompleted
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-white text-neutral-900 hover:bg-neutral-100'
            }
          `}
        >
          {isCompleted ? 'Voir les details' : "C'est parti !"}
        </button>
      </div>
    </div>
  )
}

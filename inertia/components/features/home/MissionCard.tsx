import { Check, Camera, Smartphone, Film, BookOpen, MessageCircle, Images, ArrowRight } from 'lucide-react'

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
  post: { icon: <Camera className="w-4 h-4" />, label: 'Post' },
  story: { icon: <Smartphone className="w-4 h-4" />, label: 'Story' },
  reel: { icon: <Film className="w-4 h-4" />, label: 'Reel' },
  tuto: { icon: <BookOpen className="w-4 h-4" />, label: 'Tutoriel' },
  engagement: { icon: <MessageCircle className="w-4 h-4" />, label: 'Engagement' },
  carousel: { icon: <Images className="w-4 h-4" />, label: 'Carrousel' },
}

export function MissionCard({ mission, onStart, isActive = true }: MissionCardProps) {
  const isCompleted = mission.status === 'completed'
  const isSkipped = mission.status === 'skipped'
  const typeConfig = missionTypeConfig[mission.type || 'post'] || missionTypeConfig.post

  return (
    <div
      className={`
        relative overflow-hidden rounded-3xl
        transition-all duration-300 ease-out
        ${isCompleted ? 'ring-4 ring-green-500' : ''}
        ${isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-70'}
        w-full min-h-[450px]
        shadow-xl
      `}
    >
      {/* Image de fond */}
      <img
        src={mission.coverImageUrl}
        alt={mission.title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay gradient léger en haut pour lisibilité du titre */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

      {/* Titre de la mission en haut à droite - Style Hinge */}
      <div className="absolute top-5 right-5 left-5">
        <h2
          className="text-white text-2xl font-bold text-right leading-tight"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
        >
          {mission.title}
        </h2>
      </div>

      {/* Badge statut si complété */}
      {isCompleted && (
        <div className="absolute top-5 left-5">
          <div className="bg-green-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
            <Check className="w-4 h-4" />
            <span className="font-semibold text-sm">Fait !</span>
          </div>
        </div>
      )}

      {isSkipped && (
        <div className="absolute top-5 left-5">
          <div className="bg-neutral-500 text-white px-3 py-1.5 rounded-full shadow-lg">
            <span className="font-semibold text-sm">Passé</span>
          </div>
        </div>
      )}

      {/* Encart blanc en bas - Style Hinge */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 pt-4">
        {/* Catégorie à droite */}
        <div className="flex justify-end mb-3">
          <div className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-700 px-3 py-1.5 rounded-full">
            {typeConfig.icon}
            <span className="font-medium text-sm">{typeConfig.label}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-neutral-600 text-sm mb-4 line-clamp-2">
          {mission.description}
        </p>

        {/* Bouton C'est parti */}
        <button
          type="button"
          onClick={onStart}
          className={`
            w-full rounded-xl px-6 py-3.5 font-bold text-base transition-all
            flex items-center justify-center gap-2
            active:scale-[0.98]
            ${isCompleted
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-neutral-900 text-white hover:bg-neutral-800'
            }
          `}
        >
          {isCompleted ? 'Voir les détails' : "C'est parti"}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

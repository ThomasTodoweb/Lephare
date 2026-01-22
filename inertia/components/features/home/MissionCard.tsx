import { Star, Check, Gift } from 'lucide-react'
import { Heading } from '~/components/ui'

export interface MissionCardProps {
  mission: {
    id: number
    title: string
    description: string
    coverImageUrl: string
    status?: 'pending' | 'completed' | 'skipped'
    isRecommended?: boolean
  }
  onStart: () => void
  isActive: boolean
}

export function MissionCard({ mission, onStart, isActive }: MissionCardProps) {
  const isCompleted = mission.status === 'completed'
  const isRequired = mission.isRecommended // isRecommended = mission obligatoire

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border-4
        transition-all duration-300 ease-out
        ${isCompleted ? 'border-green-500' : isRequired ? 'border-primary' : 'border-neutral-300'}
        ${isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-80'}
        h-[320px] w-full
      `}
    >
      {/* Image de fond */}
      <img
        src={mission.coverImageUrl}
        alt={mission.title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay gradient - darker if completed */}
      <div className={`absolute inset-0 ${isCompleted ? 'bg-black/60' : 'bg-gradient-to-t from-black/80 via-black/30 to-transparent'}`} />

      {/* Badge Objectif (mission principale) */}
      {isRequired && !isCompleted && (
        <div className="absolute top-3 right-3 bg-primary text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
          <Star className="w-3 h-3 fill-current" />
          Objectif
        </div>
      )}

      {/* Badge Bonus (mission optionnelle) */}
      {!isRequired && !isCompleted && (
        <div className="absolute top-3 right-3 bg-neutral-600 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
          <Gift className="w-3 h-3" />
          Bonus
        </div>
      )}

      {/* Badge Fait */}
      {isCompleted && (
        <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
          <Check className="w-3 h-3" />
          Fait !
        </div>
      )}

      {/* Contenu */}
      <div className="relative p-5 flex flex-col h-full justify-end">
        <Heading level={3} className="text-white mb-2">
          {mission.title}
        </Heading>
        <p className="text-white/90 text-sm mb-4 line-clamp-2">
          {mission.description}
        </p>
        <button
          type="button"
          onClick={onStart}
          className={`
            rounded-full px-6 py-3 font-bold uppercase text-sm tracking-wide transition-colors
            ${isCompleted
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-black text-white hover:bg-black/80'
            }
          `}
        >
          {isCompleted ? 'Voir détails' : "C'est parti !"}
        </button>
      </div>
    </div>
  )
}

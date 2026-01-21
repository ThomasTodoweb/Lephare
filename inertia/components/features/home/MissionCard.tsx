import { Heading } from '~/components/ui'

export interface MissionCardProps {
  mission: {
    id: string
    title: string
    description: string
    coverImageUrl: string
  }
  onStart: () => void
  isActive: boolean
}

export function MissionCard({ mission, onStart, isActive }: MissionCardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border-4 border-primary
        transition-all duration-300 ease-out
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

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

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
          className="bg-black text-white rounded-full px-6 py-3 font-bold uppercase text-sm tracking-wide hover:bg-black/80 transition-colors"
        >
          C'est parti !
        </button>
      </div>
    </div>
  )
}

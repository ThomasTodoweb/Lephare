import { useState, useEffect, useCallback, useMemo } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { MissionCard } from './MissionCard'

export interface Mission {
  id: number
  title: string
  description: string
  coverImageUrl: string
  type: 'post' | 'story' | 'reel' | 'tuto' | 'engagement' | 'carousel'
  status: 'pending' | 'completed' | 'skipped'
  isRecommended: boolean
}

interface MissionCarouselProps {
  missions: Mission[]
  onMissionStart: (missionId: number) => void
}

export function MissionCarousel({ missions, onMissionStart }: MissionCarouselProps) {
  // Sort missions: required (isRecommended) first, then by id
  const sortedMissions = useMemo(() => {
    return [...missions].sort((a, b) => {
      // Required mission first
      if (a.isRecommended && !b.isRecommended) return -1
      if (!a.isRecommended && b.isRecommended) return 1
      return 0
    })
  }, [missions])

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    containScroll: 'trimSnaps',
  })

  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index)
    },
    [emblaApi]
  )

  if (sortedMissions.length === 0) {
    return null
  }

  return (
    <div className="w-[calc(100%+2rem)] -mx-4">
      {/* Embla carousel container */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {sortedMissions.map((mission, index) => (
            <div
              key={mission.id}
              className="flex-[0_0_92%] min-w-0 pl-4 first:pl-4 last:pr-4"
            >
              <MissionCard
                mission={mission}
                onStart={() => onMissionStart(mission.id)}
                isActive={index === selectedIndex}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Pagination dots - star for required, circle for bonus */}
      {sortedMissions.length > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4 px-4">
          {sortedMissions.map((mission, index) => (
            <button
              key={mission.id}
              type="button"
              onClick={() => scrollTo(index)}
              className={`
                h-2.5 rounded-full transition-all duration-300
                ${index === selectedIndex
                  ? mission.isRecommended ? 'bg-primary w-6' : 'bg-neutral-500 w-6'
                  : mission.isRecommended ? 'bg-primary/40 w-2.5' : 'bg-neutral w-2.5'
                }
              `}
              aria-label={`${mission.isRecommended ? 'Objectif' : 'Bonus'} - ${mission.title}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

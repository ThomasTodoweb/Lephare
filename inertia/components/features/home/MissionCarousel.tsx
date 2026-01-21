import { useState, useEffect, useCallback } from 'react'
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
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    containScroll: false,
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

  if (missions.length === 0) {
    return null
  }

  return (
    <div className="w-[calc(100%+2rem)] -mx-4">
      {/* Embla carousel container */}
      <div className="overflow-hidden px-4" ref={emblaRef}>
        <div className="flex -mx-2">
          {missions.map((mission, index) => (
            <div
              key={mission.id}
              className="flex-[0_0_80%] min-w-0 px-2"
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

      {/* Pagination dots */}
      <div className="flex justify-center gap-2 mt-4 px-4">
        {missions.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => scrollTo(index)}
            className={`
              h-2.5 rounded-full transition-all duration-300
              ${index === selectedIndex
                ? 'bg-primary w-6'
                : 'bg-neutral w-2.5'
              }
            `}
            aria-label={`Aller à la mission ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

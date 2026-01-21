import { useState, useEffect, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { MissionCard } from './MissionCard'

export interface Mission {
  id: string
  title: string
  description: string
  coverImageUrl: string
  type: 'post' | 'story' | 'reel'
}

interface MissionCarouselProps {
  missions: Mission[]
  onMissionStart: (missionId: string) => void
}

export function MissionCarousel({ missions, onMissionStart }: MissionCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'center',
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

  if (missions.length === 0) {
    return null
  }

  return (
    <div className="w-full">
      {/* Carousel container */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 px-4">
          {missions.map((mission, index) => (
            <div
              key={mission.id}
              className="flex-shrink-0 w-[85%] max-w-[320px]"
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
      <div className="flex justify-center gap-2 mt-4">
        {missions.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => scrollTo(index)}
            className={`
              w-2.5 h-2.5 rounded-full transition-all duration-300
              ${index === selectedIndex
                ? 'bg-primary w-6'
                : 'bg-neutral'
              }
            `}
            aria-label={`Aller à la mission ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

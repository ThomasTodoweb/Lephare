import { useState, useEffect, useCallback, useMemo } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { MissionCard } from './MissionCard'

export interface Mission {
  id: number
  title: string
  description: string
  coverImageUrl: string
  mediaType?: 'image' | 'video'
  carouselImages?: string[]
  type: 'post' | 'story' | 'reel' | 'tuto' | 'engagement' | 'carousel'
  status: 'pending' | 'completed' | 'skipped'
  isRecommended: boolean
}

interface MissionCarouselProps {
  missions: Mission[]
  onMissionStart: (missionId: number) => void
}

export function MissionCarousel({ missions, onMissionStart }: MissionCarouselProps) {
  // Sort missions: completed last, then recommended first
  const sortedMissions = useMemo(() => {
    return [...missions].sort((a, b) => {
      // Completed missions go to the end
      if (a.status === 'completed' && b.status !== 'completed') return 1
      if (a.status !== 'completed' && b.status === 'completed') return -1
      // Among non-completed, recommended first
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
    </div>
  )
}

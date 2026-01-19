import { useEffect, useState } from 'react'
import { router } from '@inertiajs/react'

export function PageLoader() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const startHandler = () => {
      setLoading(true)
      setProgress(0)
    }

    const progressHandler = (event: { detail: { progress: { percentage: number } } }) => {
      if (event.detail.progress) {
        setProgress(event.detail.progress.percentage)
      }
    }

    const finishHandler = () => {
      setProgress(100)
      setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 200)
    }

    router.on('start', startHandler)
    router.on('progress', progressHandler)
    router.on('finish', finishHandler)

    return () => {
      router.off('start', startHandler)
      router.off('progress', progressHandler)
      router.off('finish', finishHandler)
    }
  }, [])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {/* Lighthouse loader animation */}
        <div className="relative w-16 h-16">
          {/* Lighthouse base */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-12 bg-primary rounded-t-lg" />
          {/* Lighthouse top */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-6 h-4 bg-primary rounded-t-full" />
          {/* Light beam animation */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-2 h-2 bg-accent rounded-full animate-pulse" />
          {/* Rotating light rays */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-accent to-transparent animate-spin origin-center" style={{ animationDuration: '1.5s' }} />
        </div>

        {/* Progress bar */}
        <div className="w-32 h-1 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${Math.max(progress, 10)}%` }}
          />
        </div>

        <p className="text-sm text-neutral-600 font-medium">Chargement...</p>
      </div>
    </div>
  )
}

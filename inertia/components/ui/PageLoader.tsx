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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
      {/* Simple red spinner */}
      <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  )
}

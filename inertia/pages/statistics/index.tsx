import { Head, Link } from '@inertiajs/react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { AppLayout } from '~/components/layout'
import { Card, PopoteMessage } from '~/components/ui'

interface KeyMetric {
  type: string
  label: string
  value: number
  icon: string
}

interface Summary {
  totalMissions: number
  totalTutorials: number
  totalPublications: number
  byType: {
    posts: number
    stories: number
    reels: number
    tutos: number
  }
}

interface Comparison {
  current: number
  previous: number
  change: number
  changePercent: number
}

interface EvolutionPoint {
  date: string
  value: number
}

interface Interpretation {
  text: string
  sentiment: 'positive' | 'neutral' | 'negative'
}

interface InstagramStats {
  followers: {
    current: number
    growthDaily: number
    growthWeekly: number
    growthMonthly: number
  }
  engagement: {
    impressions: number
    reach: number
    likes: number
    comments: number
    shares: number
    saves: number
    averageRate: number
  }
  postsCount: number
  lastUpdated: string | null
}

interface InstagramComparison {
  current: InstagramStats
  previous: InstagramStats | null
  changes: {
    followers: number
    followersPercent: number
    impressions: number
    impressionsPercent: number
    reach: number
    reachPercent: number
    engagementRate: number
  }
}

interface Props {
  keyMetrics: KeyMetric[]
  summary: Summary
  comparison: Comparison
  instagram: InstagramStats | null
  instagramComparison: InstagramComparison | null
}

/** Number of data points to display in the evolution chart */
const CHART_DISPLAY_DAYS = 14

function getXsrfToken(): string | null {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export default function StatisticsIndex({ keyMetrics, summary, comparison, instagram: initialInstagram, instagramComparison: initialInstagramComparison }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '90'>('30')
  const [evolution, setEvolution] = useState<EvolutionPoint[]>([])
  const [isLoadingEvolution, setIsLoadingEvolution] = useState(false)
  const [interpretation, setInterpretation] = useState<Interpretation | null>(null)
  const [isLoadingInterpretation, setIsLoadingInterpretation] = useState(true)
  const [instagram, setInstagram] = useState<InstagramStats | null>(initialInstagram)
  const [instagramComparison, setInstagramComparison] = useState<InstagramComparison | null>(initialInstagramComparison)
  const [isRefreshingInstagram, setIsRefreshingInstagram] = useState(false)

  // ─── useMemo hooks ────────────────────────────────────────────────────────────
  const chartData = useMemo(() => evolution.slice(-CHART_DISPLAY_DAYS), [evolution])

  const maxValue = useMemo(() => {
    if (evolution.length === 0) return 1
    return Math.max(...evolution.map((p) => p.value), 1)
  }, [evolution])

  // ─── useCallback hooks ────────────────────────────────────────────────────────
  const refreshInstagramStats = useCallback(async () => {
    setIsRefreshingInstagram(true)
    try {
      const response = await fetch('/statistics/instagram/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getXsrfToken() || '',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setInstagram(data.instagram)
        setInstagramComparison(data.instagramComparison)
      }
    } catch (error) {
      console.error('Failed to refresh Instagram stats:', error)
    } finally {
      setIsRefreshingInstagram(false)
    }
  }, [])

  // ─── useEffect hooks ──────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController()

    const fetchInterpretation = async () => {
      setIsLoadingInterpretation(true)
      try {
        const response = await fetch('/statistics/interpretation', {
          signal: controller.signal,
        })
        if (response.ok && !controller.signal.aborted) {
          const data = await response.json()
          setInterpretation(data.interpretation)
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        console.error('Failed to fetch interpretation:', error)
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingInterpretation(false)
        }
      }
    }

    fetchInterpretation()

    return () => {
      controller.abort()
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    const fetchEvolution = async () => {
      setIsLoadingEvolution(true)
      try {
        const response = await fetch(`/statistics/evolution?days=${selectedPeriod}&metric=missions_completed`, {
          signal: controller.signal,
        })
        if (response.ok && !controller.signal.aborted) {
          const data = await response.json()
          setEvolution(data.evolution || [])
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        console.error('Failed to fetch evolution:', error)
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingEvolution(false)
        }
      }
    }

    fetchEvolution()

    return () => {
      controller.abort()
    }
  }, [selectedPeriod])

  return (
    <AppLayout>
      <Head title="Mes Statistiques - Le Phare" />

      <div className="pt-6 pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-text">Mes stats</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Suivez votre progression
          </p>
        </div>

        {/* Popote AI Interpretation */}
        {isLoadingInterpretation ? (
          <Card className="mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center">
                <img src="/images/popote.png" alt="Popote" className="w-full h-full object-contain p-0.5" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-text border-t-transparent rounded-full animate-spin" />
                <span className="text-[13px] text-text-muted">Popote analyse tes stats...</span>
              </div>
            </div>
          </Card>
        ) : (
          <div className="mb-6">
            <PopoteMessage
              message={
                interpretation?.text ||
                (instagram
                  ? `Bienvenue ! Avec ${(instagram.followers?.current ?? 0).toLocaleString('fr-FR')} abonnés et ${(instagram.engagement?.impressions ?? 0).toLocaleString('fr-FR')} impressions, tu as une belle base pour progresser ensemble.`
                  : "Continue à utiliser l'app pour que je puisse t'analyser tes stats !")
              }
              variant={interpretation?.sentiment === 'positive' ? 'happy' : 'default'}
              size="md"
            />
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {keyMetrics.map((metric) => (
            <Card key={metric.type} className="text-center">
              <p className="text-[22px] font-bold text-text">{metric.value}</p>
              <p className="text-[11px] text-text-muted mt-0.5">{metric.label}</p>
            </Card>
          ))}
        </div>

        {/* Comparison card */}
        <Card variant="bordered" className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] text-text-muted">Cette semaine</p>
              <p className="text-[20px] font-bold text-text">{comparison.current} <span className="text-[13px] font-normal text-text-secondary">missions</span></p>
            </div>
            <div className="text-right">
              {comparison.change >= 0 ? (
                <span className="text-[14px] font-semibold text-emerald-600">
                  +{comparison.changePercent}%
                </span>
              ) : (
                <span className="text-[14px] font-semibold text-red-500">
                  {comparison.changePercent}%
                </span>
              )}
              <p className="text-[11px] text-text-muted">vs semaine passée</p>
            </div>
          </div>
        </Card>

        {/* Instagram Stats */}
        {instagram && (
          <>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Instagram</p>
            <Card className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                    </svg>
                  </div>
                  <span className="text-[15px] font-semibold text-text">Instagram</span>
                </div>
                <button
                  onClick={refreshInstagramStats}
                  disabled={isRefreshingInstagram}
                  className="p-2 rounded-lg hover:bg-bg-subtle transition-colors disabled:opacity-50"
                  title="Actualiser les stats"
                >
                  <svg
                    className={`w-4 h-4 text-text-muted ${isRefreshingInstagram ? 'animate-spin' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>

              {/* Followers */}
              <div className="bg-bg-subtle rounded-xl p-4 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-text-muted">Abonnés</p>
                    <p className="text-[26px] font-bold text-text">
                      {(instagram.followers?.current ?? 0).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    {(instagram.followers?.growthWeekly ?? 0) >= 0 ? (
                      <span className="text-[15px] font-semibold text-emerald-600">
                        +{instagram.followers?.growthWeekly ?? 0}
                      </span>
                    ) : (
                      <span className="text-[15px] font-semibold text-red-500">
                        {instagram.followers?.growthWeekly ?? 0}
                      </span>
                    )}
                    <p className="text-[11px] text-text-muted">cette semaine</p>
                  </div>
                </div>
              </div>

              {/* Engagement Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-bg-subtle rounded-xl p-3 text-center">
                  <p className="text-[18px] font-bold text-text">
                    {(instagram.engagement?.impressions ?? 0).toLocaleString('fr-FR')}
                  </p>
                  <p className="text-[11px] text-text-muted">Impressions</p>
                  {instagramComparison && (
                    <p className={`text-[11px] font-medium ${(instagramComparison.changes?.impressionsPercent ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {(instagramComparison.changes?.impressionsPercent ?? 0) >= 0 ? '+' : ''}{instagramComparison.changes?.impressionsPercent ?? 0}%
                    </p>
                  )}
                </div>
                <div className="bg-bg-subtle rounded-xl p-3 text-center">
                  <p className="text-[18px] font-bold text-text">
                    {(instagram.engagement?.reach ?? 0).toLocaleString('fr-FR')}
                  </p>
                  <p className="text-[11px] text-text-muted">Portée</p>
                  {instagramComparison && (
                    <p className={`text-[11px] font-medium ${(instagramComparison.changes?.reachPercent ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {(instagramComparison.changes?.reachPercent ?? 0) >= 0 ? '+' : ''}{instagramComparison.changes?.reachPercent ?? 0}%
                    </p>
                  )}
                </div>
              </div>

              {/* Engagement Details */}
              <div className="grid grid-cols-4 gap-2 text-center mb-3">
                <div className="py-2">
                  <p className="text-[14px] font-bold text-text">{(instagram.engagement?.likes ?? 0).toLocaleString('fr-FR')}</p>
                  <p className="text-[11px] text-text-muted">Likes</p>
                </div>
                <div className="py-2">
                  <p className="text-[14px] font-bold text-text">{(instagram.engagement?.comments ?? 0).toLocaleString('fr-FR')}</p>
                  <p className="text-[11px] text-text-muted">Comm.</p>
                </div>
                <div className="py-2">
                  <p className="text-[14px] font-bold text-text">{(instagram.engagement?.shares ?? 0).toLocaleString('fr-FR')}</p>
                  <p className="text-[11px] text-text-muted">Partages</p>
                </div>
                <div className="py-2">
                  <p className="text-[14px] font-bold text-text">{(instagram.engagement?.saves ?? 0).toLocaleString('fr-FR')}</p>
                  <p className="text-[11px] text-text-muted">Saves</p>
                </div>
              </div>

              {/* Engagement Rate */}
              <div className="bg-bg-subtle rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-text-muted">Taux d'engagement</p>
                    <p className="text-[20px] font-bold text-text">
                      {Number(instagram.engagement?.averageRate ?? 0).toFixed(2)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-text-secondary">
                      {Number(instagram.engagement?.averageRate ?? 0) >= 3
                        ? 'Excellent'
                        : Number(instagram.engagement?.averageRate ?? 0) >= 1
                          ? 'Bon'
                          : 'A améliorer'}
                    </p>
                  </div>
                </div>
              </div>

              {instagram.lastUpdated && (
                <p className="text-[11px] text-text-muted mt-3 text-center">
                  Mis à jour : {new Date(instagram.lastUpdated).toLocaleString('fr-FR')}
                </p>
              )}
            </Card>
          </>
        )}

        {/* Activity Summary */}
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Récapitulatif</p>
        <Card className="mb-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[14px] text-text-secondary">Total missions</span>
              <span className="text-[14px] font-semibold text-text">{summary.totalMissions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[14px] text-text-secondary">Total tutoriels</span>
              <span className="text-[14px] font-semibold text-text">{summary.totalTutorials}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[14px] text-text-secondary">Total publications</span>
              <span className="text-[14px] font-semibold text-text">{summary.totalPublications}</span>
            </div>
          </div>

          {/* Breakdown by type */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Par type</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-[15px] font-bold text-text">{summary.byType.posts}</p>
                <p className="text-[11px] text-text-muted">Posts</p>
              </div>
              <div>
                <p className="text-[15px] font-bold text-text">{summary.byType.stories}</p>
                <p className="text-[11px] text-text-muted">Stories</p>
              </div>
              <div>
                <p className="text-[15px] font-bold text-text">{summary.byType.reels}</p>
                <p className="text-[11px] text-text-muted">Réels</p>
              </div>
              <div>
                <p className="text-[15px] font-bold text-text">{summary.byType.tutos}</p>
                <p className="text-[11px] text-text-muted">Tutos</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Period selector for charts */}
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Évolution</p>
        <Card className="mb-6">
          <div className="flex gap-2 mb-4">
            {(['7', '30', '90'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-1.5 rounded-xl text-[13px] font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-text text-white'
                    : 'bg-bg-subtle text-text-secondary'
                }`}
              >
                {period}j
              </button>
            ))}
          </div>

          {/* Evolution data display */}
          <div className="bg-bg-subtle rounded-xl p-5 text-center">
            {isLoadingEvolution ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-text border-t-transparent rounded-full animate-spin" />
              </div>
            ) : evolution.length > 0 ? (
              <div>
                <div className="flex justify-between items-end h-24 gap-1 mb-3">
                  {chartData.map((point, index) => {
                    const height = (point.value / maxValue) * 100
                    return (
                      <div
                        key={index}
                        className="flex-1 bg-text rounded-t"
                        style={{ height: `${Math.max(height, 5)}%` }}
                        title={`${point.date}: ${point.value}`}
                      />
                    )
                  })}
                </div>
                <p className="text-[12px] text-text-muted">
                  {evolution.length} points sur {selectedPeriod} jours
                </p>
              </div>
            ) : (
              <>
                <p className="text-[14px] text-text-secondary">
                  Aucune donnée sur {selectedPeriod} jours
                </p>
                <p className="text-[12px] text-text-muted mt-1">
                  Continuez vos missions pour voir votre progression
                </p>
              </>
            )}
          </div>
        </Card>

        {/* Motivation */}
        <Card variant="flat" className="text-center">
          <p className="text-[14px] font-semibold text-text">
            Chaque mission compte
          </p>
          <Link href="/missions" className="text-[13px] text-text-secondary underline mt-1 inline-block">
            Faire ma mission du jour
          </Link>
        </Card>
      </div>
    </AppLayout>
  )
}

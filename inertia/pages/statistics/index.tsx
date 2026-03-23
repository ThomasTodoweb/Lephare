import { Head, Link } from '@inertiajs/react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { AppLayout } from '~/components/layout'
import { Card, Button } from '~/components/ui'

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

function Sparkline({ data, maxValue }: { data: EvolutionPoint[]; maxValue: number }) {
  if (data.length < 2) return null

  const width = 300
  const height = 60
  const padding = 4

  const points = data.map((point, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - (point.value / maxValue) * (height - padding * 2)
    return { x, y }
  })

  // Build smooth cubic bezier path
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i]
    const next = points[i + 1]
    const cpx = (current.x + next.x) / 2
    d += ` C ${cpx} ${current.y}, ${cpx} ${next.y}, ${next.x} ${next.y}`
  }

  // Fill area path
  const lastPoint = points[points.length - 1]
  const fillD = `${d} L ${lastPoint.x} ${height} L ${points[0].x} ${height} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[60px]" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dd2c0c" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#dd2c0c" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#sparkFill)" />
      <path d={d} fill="none" stroke="#dd2c0c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
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
  const [detailOpen, setDetailOpen] = useState(false)

  // ─── useMemo hooks ────────────────────────────────────────────────────────────
  const chartData = useMemo(() => evolution.slice(-CHART_DISPLAY_DAYS), [evolution])

  const maxValue = useMemo(() => {
    if (evolution.length === 0) return 1
    return Math.max(...evolution.map((p) => p.value), 1)
  }, [evolution])

  const trendIsUp = useMemo(() => {
    if (chartData.length < 2) return true
    const mid = Math.floor(chartData.length / 2)
    const firstHalf = chartData.slice(0, mid).reduce((s, p) => s + p.value, 0) / mid
    const secondHalf = chartData.slice(mid).reduce((s, p) => s + p.value, 0) / (chartData.length - mid)
    return secondHalf >= firstHalf
  }, [chartData])

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

  const sentimentEmoji = interpretation?.sentiment === 'positive' ? '\u{1F680}' : interpretation?.sentiment === 'negative' ? '\u{1F4AA}' : '\u{1F44D}'

  return (
    <AppLayout>
      <Head title="Mes Statistiques - Le Phare" />

      <div className="pt-4 pb-8 space-y-4">

        {/* ─── Zone 1 — Le Verdict (hero) ─────────────────────────────── */}
        <div className="bg-bg-card rounded-3xl shadow-md p-5">
          {isLoadingInterpretation ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-border">
                <img src="/images/popote.png" alt="Popote" className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-text border-t-transparent rounded-full animate-spin" />
                <span className="text-[13px] text-text-muted">Popote analyse tes stats...</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-border">
                  <img src="/images/popote.png" alt="Popote" className="w-full h-full object-contain" />
                </div>
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Bilan</span>
              </div>
              <p className="text-[17px] font-bold text-text text-center leading-snug">
                {interpretation?.text ||
                  (instagram
                    ? `Avec ${(instagram.followers?.current ?? 0).toLocaleString('fr-FR')} abonnés et ${(instagram.engagement?.impressions ?? 0).toLocaleString('fr-FR')} impressions, tu as une belle base pour progresser.`
                    : "Continue tes missions pour que je puisse analyser tes stats !")}
              </p>
              <span className="text-[28px]">{sentimentEmoji}</span>
            </div>
          )}
        </div>

        {/* ─── Zone 2 — 3 chiffres clés ───────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          {/* Abonnés */}
          <div className="bg-bg-card rounded-2xl p-3 text-center shadow-xs">
            <p className="text-[22px] font-black text-text">
              {instagram ? (instagram.followers?.current ?? 0).toLocaleString('fr-FR') : '—'}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">Abonnés</p>
            {instagramComparison && (instagramComparison.changes?.followersPercent ?? 0) !== 0 && (
              <div className={`flex items-center justify-center gap-0.5 mt-1 ${(instagramComparison.changes?.followersPercent ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {(instagramComparison.changes?.followersPercent ?? 0) >= 0
                  ? <ArrowUpRight size={12} />
                  : <ArrowDownRight size={12} />}
                <span className="text-[11px] font-medium">
                  {(instagramComparison.changes?.followersPercent ?? 0) >= 0 ? '+' : ''}{instagramComparison.changes?.followersPercent ?? 0}%
                </span>
              </div>
            )}
          </div>

          {/* Portée */}
          <div className="bg-bg-card rounded-2xl p-3 text-center shadow-xs">
            <p className="text-[22px] font-black text-text">
              {instagram ? (instagram.engagement?.reach ?? 0).toLocaleString('fr-FR') : '—'}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">Portée</p>
            {instagramComparison && (instagramComparison.changes?.reachPercent ?? 0) !== 0 && (
              <div className={`flex items-center justify-center gap-0.5 mt-1 ${(instagramComparison.changes?.reachPercent ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {(instagramComparison.changes?.reachPercent ?? 0) >= 0
                  ? <ArrowUpRight size={12} />
                  : <ArrowDownRight size={12} />}
                <span className="text-[11px] font-medium">
                  {(instagramComparison.changes?.reachPercent ?? 0) >= 0 ? '+' : ''}{instagramComparison.changes?.reachPercent ?? 0}%
                </span>
              </div>
            )}
          </div>

          {/* Engagement % */}
          <div className="bg-bg-card rounded-2xl p-3 text-center shadow-xs">
            <p className="text-[22px] font-black text-text">
              {instagram ? `${Number(instagram.engagement?.averageRate ?? 0).toFixed(1)}%` : '—'}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">Engagement</p>
            {instagramComparison && (instagramComparison.changes?.engagementRate ?? 0) !== 0 && (
              <div className={`flex items-center justify-center gap-0.5 mt-1 ${(instagramComparison.changes?.engagementRate ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {(instagramComparison.changes?.engagementRate ?? 0) >= 0
                  ? <ArrowUpRight size={12} />
                  : <ArrowDownRight size={12} />}
                <span className="text-[11px] font-medium">
                  {(instagramComparison.changes?.engagementRate ?? 0) >= 0 ? '+' : ''}{Number(instagramComparison.changes?.engagementRate ?? 0).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ─── Zone 3 — Conseil Popote ─────────────────────────────────── */}
        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-primary-100 shrink-0">
              <img src="/images/popote.png" alt="Popote" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-text leading-relaxed">
                {instagram
                  ? Number(instagram.engagement?.averageRate ?? 0) >= 3
                    ? 'Ton engagement est excellent ! Continue de publier régulièrement pour garder ce rythme.'
                    : Number(instagram.engagement?.averageRate ?? 0) >= 1
                      ? 'Ton engagement est bon. Essaie de poser plus de questions en story pour booster les interactions.'
                      : 'Publie au moins 3 fois par semaine et réponds à chaque commentaire pour relancer ton engagement.'
                  : 'Connecte ton compte Instagram pour recevoir des conseils personnalisés.'}
              </p>
              <Link href="/missions">
                <Button variant="ghost" size="sm" className="mt-2 px-0 text-[13px] text-text-secondary">
                  Appliquer
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Zone 4 — Détail Instagram (accordéon) ───────────────────── */}
        {instagram && (
          <div className="bg-bg-card rounded-2xl shadow-xs overflow-hidden">
            <button
              onClick={() => setDetailOpen((prev) => !prev)}
              className="w-full flex items-center justify-between p-4 active:bg-bg-subtle transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                  </svg>
                </div>
                <span className="text-[14px] font-semibold text-text">Voir le détail</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    refreshInstagramStats()
                  }}
                  disabled={isRefreshingInstagram}
                  className="p-1.5 rounded-lg hover:bg-bg-subtle transition-colors disabled:opacity-50"
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
                {detailOpen ? <ChevronUp size={18} className="text-text-muted" /> : <ChevronDown size={18} className="text-text-muted" />}
              </div>
            </button>

            {detailOpen && (
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
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

                <div className="grid grid-cols-4 gap-2 text-center">
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

                <div className="bg-bg-subtle rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] text-text-muted">Taux d'engagement</p>
                      <p className="text-[18px] font-bold text-text">
                        {Number(instagram.engagement?.averageRate ?? 0).toFixed(2)}%
                      </p>
                    </div>
                    <span className="text-[12px] text-text-secondary">
                      {Number(instagram.engagement?.averageRate ?? 0) >= 3
                        ? 'Excellent'
                        : Number(instagram.engagement?.averageRate ?? 0) >= 1
                          ? 'Bon'
                          : 'A améliorer'}
                    </span>
                  </div>
                </div>

                {instagram.lastUpdated && (
                  <p className="text-[11px] text-text-muted text-center">
                    Mis à jour : {new Date(instagram.lastUpdated).toLocaleString('fr-FR')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── Zone 5 — Sparkline simple (SVG) ─────────────────────────── */}
        <div className="bg-bg-card rounded-2xl shadow-xs p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2">
              {(['7', '30', '90'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 rounded-xl text-[12px] font-medium transition-colors ${
                    selectedPeriod === period
                      ? 'bg-text text-white'
                      : 'bg-bg-subtle text-text-secondary'
                  }`}
                >
                  {period}j
                </button>
              ))}
            </div>
            {!isLoadingEvolution && chartData.length >= 2 && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                trendIsUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
              }`}>
                {trendIsUp ? 'En progression' : 'Ralentissement'}
              </span>
            )}
          </div>

          {isLoadingEvolution ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-text border-t-transparent rounded-full animate-spin" />
            </div>
          ) : chartData.length >= 2 ? (
            <Sparkline data={chartData} maxValue={maxValue} />
          ) : (
            <div className="text-center py-6">
              <p className="text-[13px] text-text-secondary">
                Pas assez de données sur {selectedPeriod} jours
              </p>
              <p className="text-[11px] text-text-muted mt-1">
                Continue tes missions pour voir ta progression
              </p>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  )
}

import { type ReactNode } from 'react'

export interface StatCardItem {
  label: string
  value: string | number
  trend?: {
    direction: 'up' | 'down'
    percentage: number
  }
}

export interface StatCardProps {
  stat: StatCardItem
  className?: string
}

export interface StatCardGridProps {
  stats: StatCardItem[]
  className?: string
}

export function StatCard({ stat, className = '' }: StatCardProps) {
  return (
    <div
      className={`
        bg-bg-card shadow-card rounded-2xl p-4
        ${className}
      `}
    >
      <p className="text-[12px] text-text-muted font-medium mb-1">
        {stat.label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-bold text-text leading-none tabular-nums">
          {stat.value}
        </span>
        {stat.trend && (
          <span
            className={`
              text-[12px] font-semibold leading-none
              ${stat.trend.direction === 'up' ? 'text-success' : 'text-error'}
            `}
          >
            {stat.trend.direction === 'up' ? '↑' : '↓'}
            {' '}
            {stat.trend.direction === 'up' ? '+' : ''}
            {stat.trend.percentage}%
          </span>
        )}
      </div>
    </div>
  )
}

export function StatCardGrid({ stats, className = '' }: StatCardGridProps) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {stats.map((stat, i) => (
        <StatCard key={i} stat={stat} />
      ))}
    </div>
  )
}

/*
 * Usage:
 *
 * // Single stat
 * <StatCard
 *   stat={{ label: 'Abonnes', value: '1,234', trend: { direction: 'up', percentage: 12 } }}
 * />
 *
 * // Grid of stats
 * <StatCardGrid
 *   stats={[
 *     { label: 'Abonnes', value: '1,234', trend: { direction: 'up', percentage: 12 } },
 *     { label: 'Engagement', value: '4.2%', trend: { direction: 'down', percentage: 5 } },
 *     { label: 'Posts ce mois', value: 8 },
 *     { label: 'XP total', value: '2,450' },
 *   ]}
 * />
 */

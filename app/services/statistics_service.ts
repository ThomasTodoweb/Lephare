import { DateTime } from 'luxon'
import Statistic, { MetricType } from '#models/statistic'
import Mission from '#models/mission'
import TutorialCompletion from '#models/tutorial_completion'
import Streak from '#models/streak'

interface KeyMetric {
  type: MetricType
  label: string
  value: number
  icon: string
}

interface StatEvolution {
  date: string
  value: number
}

export default class StatisticsService {
  /**
   * Calculate and record daily statistics for a user
   * Called at the end of day or on-demand
   */
  async calculateDailyStats(userId: number): Promise<void> {
    const today = DateTime.utc().startOf('day')

    // Calculate all metrics
    const metrics = await this.calculateAllMetrics(userId)

    // Upsert each metric
    for (const [metricType, value] of Object.entries(metrics)) {
      await Statistic.updateOrCreate(
        {
          userId,
          metricType: metricType as MetricType,
          recordedAt: today,
        },
        {
          value,
        }
      )
    }
  }

  /**
   * Calculate all metrics for a user (cumulative totals)
   */
  private async calculateAllMetrics(
    userId: number
  ): Promise<Record<MetricType, number>> {
    // Count completed missions by type
    const missions = await Mission.query()
      .where('user_id', userId)
      .where('status', 'completed')
      .preload('missionTemplate')

    let postsCount = 0
    let storiesCount = 0
    let reelsCount = 0
    let missionsCompleted = missions.length

    for (const mission of missions) {
      const type = mission.missionTemplate?.type
      if (type === 'post') postsCount++
      else if (type === 'story') storiesCount++
      else if (type === 'reel') reelsCount++
    }

    // Count tutorials viewed
    const tutorialsViewed = await TutorialCompletion.query()
      .where('user_id', userId)
      .count('* as total')
      .first()

    // Get max streak
    const streak = await Streak.query().where('user_id', userId).first()

    return {
      posts_count: postsCount,
      stories_count: storiesCount,
      reels_count: reelsCount,
      tutorials_viewed: Number(tutorialsViewed?.$extras.total || 0),
      missions_completed: missionsCompleted,
      streak_max: streak?.longestStreak || 0,
    }
  }

  /**
   * Get 3 key metrics for the user
   */
  async getKeyMetrics(userId: number): Promise<KeyMetric[]> {
    // Calculate current totals
    const metrics = await this.calculateAllMetrics(userId)

    // Return default key metrics
    const keyMetrics: KeyMetric[] = [
      {
        type: 'missions_completed',
        label: 'Missions',
        value: metrics.missions_completed,
        icon: '✓',
      },
      {
        type: 'tutorials_viewed',
        label: 'Tutoriels',
        value: metrics.tutorials_viewed,
        icon: '📚',
      },
      {
        type: 'streak_max',
        label: 'Record streak',
        value: metrics.streak_max,
        icon: '🔥',
      },
    ]

    return keyMetrics
  }

  /**
   * Get metric evolution over time
   */
  async getMetricEvolution(
    userId: number,
    metricType: MetricType,
    days: number = 30
  ): Promise<StatEvolution[]> {
    const startDate = DateTime.utc().minus({ days }).startOf('day')

    const stats = await Statistic.query()
      .where('user_id', userId)
      .where('metric_type', metricType)
      .where('recorded_at', '>=', startDate.toSQL())
      .orderBy('recorded_at', 'asc')

    return stats.map((stat) => ({
      date: stat.recordedAt.toISODate() ?? stat.recordedAt.toISO()?.split('T')[0] ?? '',
      value: stat.value,
    }))
  }

  /**
   * Get activity summary for a user
   */
  async getActivitySummary(userId: number): Promise<{
    totalMissions: number
    totalTutorials: number
    totalPublications: number
    byType: { posts: number; stories: number; reels: number; tutos: number }
  }> {
    const metrics = await this.calculateAllMetrics(userId)

    return {
      totalMissions: metrics.missions_completed,
      totalTutorials: metrics.tutorials_viewed,
      totalPublications: metrics.posts_count + metrics.stories_count + metrics.reels_count,
      byType: {
        posts: metrics.posts_count,
        stories: metrics.stories_count,
        reels: metrics.reels_count,
        tutos: metrics.tutorials_viewed,
      },
    }
  }

  /**
   * Get comparison with previous period
   */
  async getComparison(
    userId: number,
    days: number = 7
  ): Promise<{
    current: number
    previous: number
    change: number
    changePercent: number
  }> {
    const now = DateTime.utc().startOf('day')
    const currentStart = now.minus({ days })
    const previousStart = currentStart.minus({ days })

    // Count missions in current period
    const currentMissions = await Mission.query()
      .where('user_id', userId)
      .where('status', 'completed')
      .where('completed_at', '>=', currentStart.toSQL())
      .where('completed_at', '<', now.toSQL())
      .count('* as total')
      .first()

    // Count missions in previous period
    const previousMissions = await Mission.query()
      .where('user_id', userId)
      .where('status', 'completed')
      .where('completed_at', '>=', previousStart.toSQL())
      .where('completed_at', '<', currentStart.toSQL())
      .count('* as total')
      .first()

    const current = Number(currentMissions?.$extras.total || 0)
    const previous = Number(previousMissions?.$extras.total || 0)
    const change = current - previous
    const changePercent = previous > 0 ? Math.round((change / previous) * 100) : current > 0 ? 100 : 0

    return { current, previous, change, changePercent }
  }
}

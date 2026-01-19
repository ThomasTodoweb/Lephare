import { DateTime } from 'luxon'
import InstagramStat from '#models/instagram_stat'
import LateService from '#services/late_service'
import logger from '@adonisjs/core/services/logger'

export interface InstagramStatsSnapshot {
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

export interface InstagramStatsComparison {
  current: InstagramStatsSnapshot
  previous: InstagramStatsSnapshot | null
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

export default class InstagramStatsService {
  private lateService = new LateService()

  /**
   * Sync Instagram stats from Late API and store locally
   * Should be called periodically (e.g., daily via scheduler)
   */
  async syncStats(userId: number): Promise<InstagramStat | null> {
    if (!this.lateService.isConfigured()) {
      logger.warn('Late API not configured, cannot sync Instagram stats')
      return null
    }

    const analyticsData = await this.lateService.getInstagramAnalyticsForUser(userId, 7)
    if (!analyticsData) {
      logger.info({ userId }, 'No Instagram account connected for user')
      return null
    }

    const { followers, analytics } = analyticsData
    const today = DateTime.now().startOf('day')

    // Check if we already have stats for today
    let stat = await InstagramStat.query()
      .where('user_id', userId)
      .where('recorded_at', today.toSQLDate()!)
      .first()

    if (stat) {
      // Update existing record
      stat.followersCount = followers?.currentFollowers || 0
      stat.followersGrowthDaily = followers?.growth.daily || 0
      stat.followersGrowthWeekly = followers?.growth.weekly || 0
      stat.followersGrowthMonthly = followers?.growth.monthly || 0
      stat.totalImpressions = analytics?.totals.impressions || 0
      stat.totalReach = analytics?.totals.reach || 0
      stat.totalLikes = analytics?.totals.likes || 0
      stat.totalComments = analytics?.totals.comments || 0
      stat.totalShares = analytics?.totals.shares || 0
      stat.totalSaves = analytics?.totals.saves || 0
      stat.averageEngagementRate = analytics?.averageEngagementRate || 0
      stat.postsCount = analytics?.topPosts.length || 0
    } else {
      // Create new record
      stat = await InstagramStat.create({
        userId,
        recordedAt: today,
        followersCount: followers?.currentFollowers || 0,
        followersGrowthDaily: followers?.growth.daily || 0,
        followersGrowthWeekly: followers?.growth.weekly || 0,
        followersGrowthMonthly: followers?.growth.monthly || 0,
        totalImpressions: analytics?.totals.impressions || 0,
        totalReach: analytics?.totals.reach || 0,
        totalLikes: analytics?.totals.likes || 0,
        totalComments: analytics?.totals.comments || 0,
        totalShares: analytics?.totals.shares || 0,
        totalSaves: analytics?.totals.saves || 0,
        averageEngagementRate: analytics?.averageEngagementRate || 0,
        postsCount: analytics?.topPosts.length || 0,
      })
    }

    await stat.save()
    logger.info({ userId, statId: stat.id }, 'Instagram stats synced')
    return stat
  }

  /**
   * Get latest Instagram stats for a user
   * First tries to get from Late API directly, falls back to cached data
   */
  async getLatestStats(userId: number, forceRefresh: boolean = false): Promise<InstagramStatsSnapshot | null> {
    if (forceRefresh && this.lateService.isConfigured()) {
      await this.syncStats(userId)
    }

    // Get the most recent local stat
    const stat = await InstagramStat.query()
      .where('user_id', userId)
      .orderBy('recorded_at', 'desc')
      .first()

    if (!stat) {
      // Try to sync if no local data exists
      if (this.lateService.isConfigured()) {
        const syncedStat = await this.syncStats(userId)
        if (syncedStat) {
          return this.statToSnapshot(syncedStat)
        }
      }
      return null
    }

    return this.statToSnapshot(stat)
  }

  /**
   * Get stats comparison between current and previous period
   */
  async getStatsComparison(userId: number, days: number = 7): Promise<InstagramStatsComparison | null> {
    const now = DateTime.now().startOf('day')
    const periodStart = now.minus({ days })
    const previousPeriodEnd = periodStart.minus({ days: 1 })
    const previousPeriodStart = previousPeriodEnd.minus({ days })

    // Get current period stats (most recent)
    const currentStat = await InstagramStat.query()
      .where('user_id', userId)
      .where('recorded_at', '>=', periodStart.toSQLDate()!)
      .orderBy('recorded_at', 'desc')
      .first()

    // Get previous period stats
    const previousStat = await InstagramStat.query()
      .where('user_id', userId)
      .where('recorded_at', '>=', previousPeriodStart.toSQLDate()!)
      .where('recorded_at', '<=', previousPeriodEnd.toSQLDate()!)
      .orderBy('recorded_at', 'desc')
      .first()

    if (!currentStat) {
      return null
    }

    const current = this.statToSnapshot(currentStat)
    const previous = previousStat ? this.statToSnapshot(previousStat) : null

    const calculateChange = (curr: number, prev: number | undefined): number => {
      if (!prev || prev === 0) return 0
      return curr - prev
    }

    const calculatePercent = (curr: number, prev: number | undefined): number => {
      if (!prev || prev === 0) return 0
      return Math.round(((curr - prev) / prev) * 100)
    }

    return {
      current,
      previous,
      changes: {
        followers: calculateChange(current.followers.current, previous?.followers.current),
        followersPercent: calculatePercent(current.followers.current, previous?.followers.current),
        impressions: calculateChange(current.engagement.impressions, previous?.engagement.impressions),
        impressionsPercent: calculatePercent(current.engagement.impressions, previous?.engagement.impressions),
        reach: calculateChange(current.engagement.reach, previous?.engagement.reach),
        reachPercent: calculatePercent(current.engagement.reach, previous?.engagement.reach),
        engagementRate: current.engagement.averageRate - (previous?.engagement.averageRate || 0),
      },
    }
  }

  /**
   * Get stats evolution over time
   */
  async getStatsEvolution(
    userId: number,
    days: number = 30
  ): Promise<Array<{ date: string; followers: number; impressions: number; reach: number }>> {
    const startDate = DateTime.now().minus({ days }).startOf('day')

    const stats = await InstagramStat.query()
      .where('user_id', userId)
      .where('recorded_at', '>=', startDate.toSQLDate()!)
      .orderBy('recorded_at', 'asc')

    return stats.map((stat) => ({
      date: stat.recordedAt.toISODate()!,
      followers: stat.followersCount,
      impressions: stat.totalImpressions,
      reach: stat.totalReach,
    }))
  }

  /**
   * Convert InstagramStat model to snapshot interface
   */
  private statToSnapshot(stat: InstagramStat): InstagramStatsSnapshot {
    return {
      followers: {
        current: stat.followersCount,
        growthDaily: stat.followersGrowthDaily,
        growthWeekly: stat.followersGrowthWeekly,
        growthMonthly: stat.followersGrowthMonthly,
      },
      engagement: {
        impressions: stat.totalImpressions,
        reach: stat.totalReach,
        likes: stat.totalLikes,
        comments: stat.totalComments,
        shares: stat.totalShares,
        saves: stat.totalSaves,
        averageRate: stat.averageEngagementRate,
      },
      postsCount: stat.postsCount,
      lastUpdated: stat.updatedAt?.toISO() || null,
    }
  }
}

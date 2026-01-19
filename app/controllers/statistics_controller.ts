import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import StatisticsService from '#services/statistics_service'
import InstagramStatsService from '#services/instagram_stats_service'
import AIService from '#services/ai_service'
import Streak from '#models/streak'
import User from '#models/user'
import type { MetricType } from '#models/statistic'

// Cache interpretation for 3 days
const AI_INTERPRETATION_CACHE_DAYS = 3

export default class StatisticsController {
  /**
   * Show statistics dashboard
   */
  async index({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const statsService = new StatisticsService()
    const instagramStatsService = new InstagramStatsService()

    const keyMetrics = await statsService.getKeyMetrics(user.id)
    const summary = await statsService.getActivitySummary(user.id)
    const comparison = await statsService.getComparison(user.id, 7)

    // Get Instagram stats
    const instagramStats = await instagramStatsService.getLatestStats(user.id, true)
    const instagramComparison = await instagramStatsService.getStatsComparison(user.id, 7)

    return inertia.render('statistics/index', {
      keyMetrics,
      summary,
      comparison,
      instagram: instagramStats,
      instagramComparison,
    })
  }

  /**
   * Get AI interpretation of user stats
   * Cached for 3 days to avoid regenerating on every visit
   */
  async interpretation({ response, auth }: HttpContext) {
    const authUser = auth.getUserOrFail()

    // Load the user with full model to access cache fields
    const user = await User.findOrFail(authUser.id)

    // Check if we have a cached interpretation that's still valid
    if (user.aiInterpretation && user.aiInterpretationAt) {
      const cacheExpiry = user.aiInterpretationAt.plus({ days: AI_INTERPRETATION_CACHE_DAYS })
      if (DateTime.utc() < cacheExpiry) {
        // Return cached interpretation
        return response.json({ interpretation: user.aiInterpretation })
      }
    }

    const statsService = new StatisticsService()
    const instagramStatsService = new InstagramStatsService()
    const aiService = new AIService()

    // Check if AI is configured
    if (!aiService.isConfigured()) {
      return response.json({
        interpretation: null,
        error: 'AI service not configured',
      })
    }

    // Get all the data needed for interpretation
    const summary = await statsService.getActivitySummary(user.id)
    const comparison = await statsService.getComparison(user.id, 7)
    const streak = await Streak.query().where('user_id', user.id).first()
    const instagramStats = await instagramStatsService.getLatestStats(user.id)
    const instagramComparison = await instagramStatsService.getStatsComparison(user.id, 7)

    // Generate interpretation with Instagram data
    const interpretation = await aiService.generateStatsInterpretation({
      missionsCompleted: summary.totalMissions,
      totalTutorials: summary.totalTutorials,
      totalPublications: summary.totalPublications,
      currentStreak: streak?.currentStreak || 0,
      weeklyChange: comparison.change,
      weeklyChangePercent: comparison.changePercent,
      // Instagram metrics
      instagramFollowers: instagramStats?.followers.current,
      instagramFollowersGrowth: instagramComparison?.changes.followers,
      instagramImpressions: instagramStats?.engagement.impressions,
      instagramReach: instagramStats?.engagement.reach,
      instagramEngagementRate: instagramStats?.engagement.averageRate,
    })

    // Cache the interpretation if it was generated successfully
    if (interpretation) {
      user.aiInterpretation = interpretation
      user.aiInterpretationAt = DateTime.utc()
      await user.save()
    }

    return response.json({ interpretation })
  }

  /**
   * Get evolution data for a specific metric
   */
  async evolution({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const metricTypeInput = request.input('metric', 'missions_completed')
    const days = Number(request.input('days', 30))

    // Validate metricType against allowed values
    const validMetricTypes: MetricType[] = [
      'posts_count',
      'stories_count',
      'reels_count',
      'tutorials_viewed',
      'missions_completed',
      'streak_max',
    ]

    if (!validMetricTypes.includes(metricTypeInput)) {
      return response.status(400).json({ error: 'Invalid metric type' })
    }

    const metricType = metricTypeInput as MetricType

    if (Number.isNaN(days) || days < 7 || days > 365) {
      return response.status(400).json({ error: 'Invalid days parameter' })
    }

    const statsService = new StatisticsService()
    const evolution = await statsService.getMetricEvolution(user.id, metricType, days)

    return response.json({ evolution })
  }

  /**
   * Get activity summary
   */
  async summary({ response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const statsService = new StatisticsService()

    const summary = await statsService.getActivitySummary(user.id)

    return response.json(summary)
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import StatisticsService from '#services/statistics_service'
import type { MetricType } from '#models/statistic'

export default class StatisticsController {
  /**
   * Show statistics dashboard
   */
  async index({ inertia, auth }: HttpContext) {
    const user = auth.user!
    const statsService = new StatisticsService()

    const keyMetrics = await statsService.getKeyMetrics(user.id)
    const summary = await statsService.getActivitySummary(user.id)
    const comparison = await statsService.getComparison(user.id, 7)

    return inertia.render('statistics/index', {
      keyMetrics,
      summary,
      comparison,
    })
  }

  /**
   * Get evolution data for a specific metric
   */
  async evolution({ request, response, auth }: HttpContext) {
    const user = auth.user!
    const metricType = request.input('metric', 'missions_completed') as MetricType
    const days = Number(request.input('days', 30))

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
    const user = auth.user!
    const statsService = new StatisticsService()

    const summary = await statsService.getActivitySummary(user.id)

    return response.json(summary)
  }
}

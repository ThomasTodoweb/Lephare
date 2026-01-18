import type { HttpContext } from '@adonisjs/core/http'
import AlertsService from '#services/alerts_service'

export default class AlertsController {
  private alertsService = new AlertsService()

  /**
   * Show alerts dashboard (FR47)
   */
  async index({ inertia }: HttpContext) {
    const stats = await this.alertsService.getAlertStats()
    const targets = await this.alertsService.getAlertTargets({ type: 'all', limit: 20 })

    return inertia.render('admin/alerts/index', {
      stats,
      targets,
    })
  }

  /**
   * Get filtered alert targets
   */
  async targets({ inertia, request }: HttpContext) {
    const type = request.input('type', 'all') as 'inactive' | 'streak_lost' | 'all'
    const days = Number(request.input('days', 7))

    const targets = await this.alertsService.getAlertTargets({
      type,
      inactiveDays: days,
      limit: 50,
    })

    return inertia.render('admin/alerts/targets', {
      targets,
      currentType: type,
      currentDays: days,
    })
  }

  /**
   * Send alert to a single user (FR48)
   */
  async send({ request, response }: HttpContext) {
    const { userId, alertType } = request.only(['userId', 'alertType'])

    if (!userId || !alertType) {
      return response.badRequest({ error: 'Missing userId or alertType' })
    }

    const success = await this.alertsService.sendReengagementAlert(userId, alertType)

    if (!success) {
      return response.badRequest({ error: 'Failed to send alert' })
    }

    return response.json({ success: true })
  }

  /**
   * Send bulk alerts
   */
  async sendBulk({ request, response }: HttpContext) {
    const { userIds, alertType } = request.only(['userIds', 'alertType'])

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return response.badRequest({ error: 'No users selected' })
    }

    const result = await this.alertsService.sendBulkAlerts(userIds, alertType)

    return response.json(result)
  }

  /**
   * API: Get stats
   */
  async stats({ response }: HttpContext) {
    const stats = await this.alertsService.getAlertStats()
    return response.json(stats)
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import AlertsService from '#services/alerts_service'
import { sendAlertValidator, sendBulkAlertsValidator } from '#validators/admin'
import audit from '#services/audit_service'

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
    const rawType = request.input('type', 'all') as string
    const validTypes = ['inactive', 'streak_lost', 'all'] as const
    const type = validTypes.includes(rawType as any)
      ? (rawType as 'inactive' | 'streak_lost' | 'all')
      : 'all'

    const rawDays = Number(request.input('days', 7))
    const days = Number.isNaN(rawDays) || rawDays < 1 ? 7 : Math.min(rawDays, 90)

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
    const data = await request.validateUsing(sendAlertValidator)

    const success = await this.alertsService.sendReengagementAlert(data.userId, data.alertType)

    if (!success) {
      return response.badRequest({ error: 'Failed to send alert' })
    }

    // Audit log
    audit.log('alert_send', 0, {
      targetId: data.userId,
      targetType: 'user',
      details: { alertType: data.alertType },
    })

    return response.redirect().back()
  }

  /**
   * Send bulk alerts with validation
   */
  async sendBulk({ request, response }: HttpContext) {
    const data = await request.validateUsing(sendBulkAlertsValidator)

    // Validate each userId is a positive integer (double check after validation)
    const validUserIds = data.userIds.filter((id) => Number.isInteger(id) && id > 0)

    if (validUserIds.length === 0) {
      return response.badRequest({ error: 'No valid users selected' })
    }

    await this.alertsService.sendBulkAlerts(validUserIds, data.alertType)

    // Audit log
    audit.log('alert_bulk_send', 0, {
      details: { userCount: validUserIds.length, alertType: data.alertType },
    })

    return response.redirect().back()
  }

  /**
   * API: Get stats
   */
  async stats({ response }: HttpContext) {
    const stats = await this.alertsService.getAlertStats()
    return response.json(stats)
  }
}

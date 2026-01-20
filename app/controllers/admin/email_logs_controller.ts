import type { HttpContext } from '@adonisjs/core/http'
import EmailLog from '#models/email_log'

export default class EmailLogsController {
  /**
   * Display email logs history
   */
  async index({ request, inertia }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = 20
    const status = request.input('status')
    const emailType = request.input('type')
    const search = request.input('search')

    // Build query
    let query = EmailLog.query()
      .orderBy('created_at', 'desc')
      .preload('user')

    // Filter by status
    if (status && status !== 'all') {
      query = query.where('status', status)
    }

    // Filter by email type
    if (emailType && emailType !== 'all') {
      query = query.where('email_type', emailType)
    }

    // Search by email
    if (search) {
      query = query.where((q) => {
        q.whereILike('to_email', `%${search}%`)
          .orWhereILike('subject', `%${search}%`)
      })
    }

    const logs = await query.paginate(page, perPage)

    // Get stats
    const stats = await this.getStats()

    return inertia.render('admin/email-logs/index', {
      logs: logs.serialize(),
      filters: { status, emailType, search },
      stats,
    })
  }

  /**
   * Get email statistics
   */
  private async getStats() {
    const total = await EmailLog.query().count('* as count')
    const sent = await EmailLog.query().where('status', 'sent').count('* as count')
    const failed = await EmailLog.query().where('status', 'failed').count('* as count')
    const bounced = await EmailLog.query().where('status', 'bounced').count('* as count')

    // Last 24h stats
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const last24h = await EmailLog.query()
      .where('created_at', '>=', yesterday)
      .count('* as count')

    const last24hFailed = await EmailLog.query()
      .where('created_at', '>=', yesterday)
      .where('status', 'failed')
      .count('* as count')

    return {
      total: Number(total[0].$extras.count),
      sent: Number(sent[0].$extras.count),
      failed: Number(failed[0].$extras.count),
      bounced: Number(bounced[0].$extras.count),
      last24h: Number(last24h[0].$extras.count),
      last24hFailed: Number(last24hFailed[0].$extras.count),
    }
  }

  /**
   * Show single email log details
   */
  async show({ params, inertia }: HttpContext) {
    const log = await EmailLog.query()
      .where('id', params.id)
      .preload('user')
      .firstOrFail()

    return inertia.render('admin/email-logs/show', { log })
  }

  /**
   * Manually update email status (for webhooks or manual updates)
   */
  async updateStatus({ params, request, response, session }: HttpContext) {
    const log = await EmailLog.findOrFail(params.id)
    const { status, errorMessage } = request.only(['status', 'errorMessage'])

    if (status) {
      log.status = status
    }
    if (errorMessage !== undefined) {
      log.errorMessage = errorMessage
    }

    await log.save()

    session.flash('success', 'Statut mis à jour')
    return response.redirect().back()
  }

  /**
   * Delete old logs (cleanup)
   */
  async cleanup({ request, response, session }: HttpContext) {
    const days = request.input('days', 30)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const deleted = await EmailLog.query()
      .where('created_at', '<', cutoffDate)
      .delete()

    session.flash('success', `${deleted.length || deleted} logs supprimés (plus de ${days} jours)`)
    return response.redirect('/admin/email-logs')
  }
}

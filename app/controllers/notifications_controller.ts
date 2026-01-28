import type { HttpContext } from '@adonisjs/core/http'
import PushService from '#services/push_service'
import InAppNotificationService from '#services/in_app_notification_service'
import User from '#models/user'

export default class NotificationsController {
  /**
   * Notifications page - affiche les notifications in-app
   */
  async index({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const notificationService = new InAppNotificationService()

    const notifications = await notificationService.getForUser(user.id, { limit: 50 })
    const unreadCount = await notificationService.countUnread(user.id)

    return inertia.render('notifications/index', {
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        type: n.type,
        data: n.data,
        isRead: n.isRead,
        createdAt: n.createdAt.toISO(),
      })),
      unreadCount,
    })
  }

  /**
   * Récupérer les notifications (API JSON)
   */
  async list({ response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const notificationService = new InAppNotificationService()

    const notifications = await notificationService.getForUser(user.id, { limit: 50 })
    const unreadCount = await notificationService.countUnread(user.id)

    return response.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        type: n.type,
        data: n.data,
        isRead: n.isRead,
        createdAt: n.createdAt.toISO(),
      })),
      unreadCount,
    })
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead({ params, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const notificationService = new InAppNotificationService()

    const success = await notificationService.markAsRead(params.id, user.id)

    if (!success) {
      return response.status(404).json({ error: 'Notification non trouvée' })
    }

    return response.json({ success: true })
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead({ response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const notificationService = new InAppNotificationService()

    const count = await notificationService.markAllAsRead(user.id)

    return response.json({ success: true, count })
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification({ params, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const notificationService = new InAppNotificationService()

    const success = await notificationService.delete(params.id, user.id)

    if (!success) {
      return response.status(404).json({ error: 'Notification non trouvée' })
    }

    return response.json({ success: true })
  }

  /**
   * Get VAPID public key for client
   */
  async publicKey({ response }: HttpContext) {
    const pushService = new PushService()
    const publicKey = pushService.getPublicKey()

    if (!publicKey) {
      return response.status(503).json({ error: 'Push notifications not configured' })
    }

    return response.json({ publicKey })
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const { subscription, reminderTime } = request.only(['subscription', 'reminderTime'])

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return response.status(400).json({ error: 'Invalid subscription data' })
    }

    const pushService = new PushService()

    if (!pushService.isConfigured()) {
      return response.status(503).json({ error: 'Push notifications not configured' })
    }

    try {
      const time = reminderTime || '10:00'
      await pushService.subscribe(user.id, subscription, time)

      // Synchronize email notification time with push notification time
      await User.query().where('id', user.id).update({ emailNotificationTime: time })

      return response.json({ success: true, message: 'Notifications activées !' })
    } catch (error) {
      console.error('NotificationsController: Subscribe error', error)
      return response.status(500).json({ error: 'Failed to subscribe' })
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe({ request, response }: HttpContext) {
    const { endpoint } = request.only(['endpoint'])

    if (!endpoint) {
      return response.status(400).json({ error: 'Endpoint required' })
    }

    const pushService = new PushService()

    const success = await pushService.unsubscribe(endpoint)

    if (success) {
      return response.json({ success: true, message: 'Notifications désactivées' })
    }

    return response.status(404).json({ error: 'Subscription not found' })
  }

  /**
   * Update reminder time
   */
  async updateSettings({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const { reminderTime } = request.only(['reminderTime'])

    // Validate time format HH:MM
    if (!reminderTime || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(reminderTime)) {
      return response.status(400).json({ error: 'Format invalide (HH:MM)' })
    }

    const pushService = new PushService()
    await pushService.updateReminderTime(user.id, reminderTime)

    // Synchronize email notification time with push notification time
    await User.query().where('id', user.id).update({ emailNotificationTime: reminderTime })

    return response.json({ success: true, message: 'Heure de rappel mise à jour' })
  }

  /**
   * Test push notification (for debugging)
   */
  async test({ response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const pushService = new PushService()

    if (!pushService.isConfigured()) {
      return response.status(503).json({ error: 'Push notifications not configured' })
    }

    const result = await pushService.sendToUser(user.id, {
      title: 'Test Le Phare 🔥',
      body: 'Ceci est une notification test !',
      url: '/dashboard',
      type: 'general',
    })

    return response.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
    })
  }
}

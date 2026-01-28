import InAppNotification from '#models/in_app_notification'
import type { NotificationType } from '#models/in_app_notification'

interface CreateNotificationParams {
  userId: number
  title: string
  body: string
  type?: NotificationType
  data?: Record<string, unknown>
}

export default class InAppNotificationService {
  /**
   * Créer une notification in-app pour un utilisateur
   */
  async create(params: CreateNotificationParams): Promise<InAppNotification> {
    return InAppNotification.create({
      userId: params.userId,
      title: params.title,
      body: params.body,
      type: params.type || 'general',
      data: params.data || null,
    })
  }

  /**
   * Récupérer toutes les notifications d'un utilisateur
   */
  async getForUser(
    userId: number,
    options: { limit?: number; unreadOnly?: boolean } = {}
  ): Promise<InAppNotification[]> {
    const query = InAppNotification.query()
      .where('user_id', userId)
      .orderBy('created_at', 'desc')

    if (options.unreadOnly) {
      query.whereNull('read_at')
    }

    if (options.limit) {
      query.limit(options.limit)
    }

    return query
  }

  /**
   * Compter les notifications non lues
   */
  async countUnread(userId: number): Promise<number> {
    const result = await InAppNotification.query()
      .where('user_id', userId)
      .whereNull('read_at')
      .count('* as total')

    return Number(result[0].$extras.total) || 0
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    const notification = await InAppNotification.query()
      .where('id', notificationId)
      .where('user_id', userId)
      .first()

    if (!notification) {
      return false
    }

    if (!notification.readAt) {
      notification.readAt = await import('luxon').then((m) => m.DateTime.now())
      await notification.save()
    }

    return true
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(userId: number): Promise<number> {
    const { DateTime } = await import('luxon')
    const result = await InAppNotification.query()
      .where('user_id', userId)
      .whereNull('read_at')
      .update({ readAt: DateTime.now().toSQL() })

    return Array.isArray(result) ? result.length : result
  }

  /**
   * Supprimer une notification
   */
  async delete(notificationId: number, userId: number): Promise<boolean> {
    const notification = await InAppNotification.query()
      .where('id', notificationId)
      .where('user_id', userId)
      .first()

    if (!notification) {
      return false
    }

    await notification.delete()
    return true
  }

  /**
   * Supprimer les anciennes notifications (maintenance)
   */
  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const { DateTime } = await import('luxon')
    const cutoffDate = DateTime.now().minus({ days: daysOld }).toSQL()

    const result = await InAppNotification.query()
      .where('created_at', '<', cutoffDate!)
      .whereNotNull('read_at')
      .delete()

    return Array.isArray(result) ? result.length : result
  }
}

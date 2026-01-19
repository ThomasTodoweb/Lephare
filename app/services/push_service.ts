import env from '#start/env'
import PushSubscription from '#models/push_subscription'
import webpush from 'web-push'

interface PushPayload {
  title: string
  body: string
  icon?: string
  url?: string
  tag?: string
}

export default class PushService {
  private vapidPublicKey: string | undefined
  private vapidPrivateKey: string | undefined
  private vapidSubject: string | undefined

  constructor() {
    this.vapidPublicKey = env.get('VAPID_PUBLIC_KEY')
    this.vapidPrivateKey = env.get('VAPID_PRIVATE_KEY')
    this.vapidSubject = env.get('VAPID_SUBJECT') || 'mailto:contact@lephare.todoweb.fr'

    // Configure web-push with VAPID keys
    if (this.isConfigured()) {
      webpush.setVapidDetails(this.vapidSubject, this.vapidPublicKey!, this.vapidPrivateKey!)
    }
  }

  /**
   * Check if push service is configured
   */
  isConfigured(): boolean {
    return !!(this.vapidPublicKey && this.vapidPrivateKey)
  }

  /**
   * Get VAPID public key for client subscription
   */
  getPublicKey(): string | null {
    return this.vapidPublicKey || null
  }

  /**
   * Subscribe a device to push notifications
   */
  async subscribe(
    userId: number,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    reminderTime: string = '10:00'
  ): Promise<PushSubscription> {
    // Check if subscription already exists
    const existing = await PushSubscription.query()
      .where('endpoint', subscription.endpoint)
      .first()

    if (existing) {
      // Update existing subscription
      existing.userId = userId
      existing.p256dhKey = subscription.keys.p256dh
      existing.authKey = subscription.keys.auth
      existing.isActive = true
      existing.reminderTime = reminderTime
      await existing.save()
      return existing
    }

    // Create new subscription
    return PushSubscription.create({
      userId,
      endpoint: subscription.endpoint,
      p256dhKey: subscription.keys.p256dh,
      authKey: subscription.keys.auth,
      isActive: true,
      reminderTime,
    })
  }

  /**
   * Unsubscribe a device from push notifications
   */
  async unsubscribe(endpoint: string): Promise<boolean> {
    const subscription = await PushSubscription.query().where('endpoint', endpoint).first()

    if (subscription) {
      subscription.isActive = false
      await subscription.save()
      return true
    }

    return false
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId: number, payload: PushPayload): Promise<{ sent: number; failed: number }> {
    const subscriptions = await PushSubscription.query()
      .where('user_id', userId)
      .where('is_active', true)

    let sent = 0
    let failed = 0

    for (const subscription of subscriptions) {
      try {
        await this.sendPush(subscription, payload)
        sent++
      } catch (error) {
        console.error('PushService: Failed to send push', error)
        // Mark as inactive if endpoint is invalid
        if (this.isEndpointInvalid(error)) {
          subscription.isActive = false
          await subscription.save()
        }
        failed++
      }
    }

    return { sent, failed }
  }

  /**
   * Send push notification to a specific subscription
   */
  private async sendPush(subscription: PushSubscription, payload: PushPayload): Promise<void> {
    if (!this.isConfigured()) {
      console.log('PushService: VAPID keys not configured')
      throw new Error('VAPID keys not configured')
    }

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dhKey,
        auth: subscription.authKey,
      },
    }

    await webpush.sendNotification(pushSubscription, JSON.stringify(payload))
    console.log('PushService: Push sent to', subscription.endpoint.substring(0, 50))
  }

  /**
   * Check if error indicates invalid endpoint
   */
  private isEndpointInvalid(error: unknown): boolean {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const statusCode = (error as { statusCode: number }).statusCode
      return statusCode === 404 || statusCode === 410
    }
    return false
  }

  /**
   * Update reminder time for a user's subscriptions
   */
  async updateReminderTime(userId: number, reminderTime: string): Promise<void> {
    await PushSubscription.query().where('user_id', userId).update({ reminderTime })
  }

  /**
   * Get all subscriptions for a specific reminder time (for cron job)
   */
  async getSubscriptionsByReminderTime(
    reminderTime: string
  ): Promise<Array<{ userId: number; subscription: PushSubscription }>> {
    const subscriptions = await PushSubscription.query()
      .where('reminder_time', reminderTime)
      .where('is_active', true)
      .preload('user')

    return subscriptions.map((sub) => ({
      userId: sub.userId,
      subscription: sub,
    }))
  }
}

import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import User from '#models/user'
import PushSubscription from '#models/push_subscription'

export default class SyncNotificationTimes extends BaseCommand {
  static commandName = 'notifications:sync-times'
  static description = 'Synchronise l\'heure des emails avec l\'heure des notifications push pour tous les utilisateurs'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('Synchronisation des heures de notification...')

    // Get all users with push subscriptions
    const subscriptions = await PushSubscription.query()
      .select('user_id', 'reminder_time')
      .groupBy('user_id', 'reminder_time')

    let updated = 0
    let skipped = 0

    for (const sub of subscriptions) {
      const user = await User.find(sub.userId)
      if (!user) {
        skipped++
        continue
      }

      // Only update if times are different
      if (user.emailNotificationTime !== sub.reminderTime) {
        user.emailNotificationTime = sub.reminderTime
        await user.save()
        this.logger.info(`User ${user.id} (${user.email}): ${user.emailNotificationTime} -> ${sub.reminderTime}`)
        updated++
      } else {
        skipped++
      }
    }

    this.logger.success(`Synchronisation terminée: ${updated} mis à jour, ${skipped} déjà synchronisés`)
  }
}

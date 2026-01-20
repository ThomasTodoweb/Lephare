import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Email verification
      table.boolean('email_verified').defaultTo(false)
      table.string('email_verification_code', 6).nullable()
      table.timestamp('email_verification_code_expires_at').nullable()

      // Password reset
      table.string('password_reset_token').nullable().unique()
      table.timestamp('password_reset_token_expires_at').nullable()

      // Email notifications preferences
      table.boolean('email_notifications_enabled').defaultTo(true)
      table.string('email_notification_time', 5).defaultTo('10:00') // HH:mm format
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('email_verified')
      table.dropColumn('email_verification_code')
      table.dropColumn('email_verification_code_expires_at')
      table.dropColumn('password_reset_token')
      table.dropColumn('password_reset_token_expires_at')
      table.dropColumn('email_notifications_enabled')
      table.dropColumn('email_notification_time')
    })
  }
}

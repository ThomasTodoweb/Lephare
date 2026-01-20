import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Granular email preferences
      // Daily mission reminder email (same time as push notification)
      table.boolean('email_daily_mission_enabled').defaultTo(true)
      // Weekly summary email with AI analysis (sent Monday morning)
      table.boolean('email_weekly_summary_enabled').defaultTo(true)
      // Account/profile change notifications
      table.boolean('email_account_changes_enabled').defaultTo(true)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('email_daily_mission_enabled')
      table.dropColumn('email_weekly_summary_enabled')
      table.dropColumn('email_account_changes_enabled')
    })
  }
}

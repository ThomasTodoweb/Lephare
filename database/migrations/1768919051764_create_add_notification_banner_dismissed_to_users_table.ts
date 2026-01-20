import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Track if user dismissed the notification banner (to avoid showing again)
      table.boolean('notification_banner_dismissed').defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('notification_banner_dismissed')
    })
  }
}

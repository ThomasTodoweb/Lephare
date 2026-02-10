import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mission_templates'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('notification_time', 5).nullable().defaultTo(null)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('notification_time')
    })
  }
}

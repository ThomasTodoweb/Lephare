import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'restaurants'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('welcome_video_seen').defaultTo(false).notNullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('welcome_video_seen')
    })
  }
}

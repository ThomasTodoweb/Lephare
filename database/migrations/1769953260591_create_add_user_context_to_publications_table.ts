import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'publications'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // User context transcribed from voice for AI description generation
      table.text('user_context').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('user_context')
    })
  }
}

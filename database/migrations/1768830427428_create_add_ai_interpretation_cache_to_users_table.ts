import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Store the AI interpretation as JSON (text, sentiment)
      table.json('ai_interpretation').nullable()
      // Timestamp when the interpretation was generated
      table.timestamp('ai_interpretation_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('ai_interpretation')
      table.dropColumn('ai_interpretation_at')
    })
  }
}

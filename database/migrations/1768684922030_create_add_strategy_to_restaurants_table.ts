import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'restaurants'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('strategy_id')
        .unsigned()
        .references('id')
        .inTable('strategies')
        .onDelete('SET NULL')
        .nullable()
      table
        .enum('publication_rhythm', ['once_week', 'three_week', 'five_week', 'daily'])
        .nullable()
      table.boolean('onboarding_completed').defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('strategy_id')
      table.dropColumn('publication_rhythm')
      table.dropColumn('onboarding_completed')
    })
  }
}
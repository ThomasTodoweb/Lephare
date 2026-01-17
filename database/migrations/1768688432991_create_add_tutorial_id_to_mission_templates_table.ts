import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mission_templates'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Add tutorial_id for tuto missions (nullable, only used when type = 'tuto')
      table
        .integer('tutorial_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('tutorials')
        .onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('tutorial_id')
    })
  }
}

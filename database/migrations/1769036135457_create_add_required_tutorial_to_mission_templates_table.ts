import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mission_templates'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('required_tutorial_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('tutorials')
        .onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('required_tutorial_id')
    })
  }
}

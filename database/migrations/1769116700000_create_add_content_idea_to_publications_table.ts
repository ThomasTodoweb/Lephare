import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'publications'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Link to content idea that inspired this publication
      table
        .integer('content_idea_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('content_ideas')
        .onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('content_idea_id')
    })
  }
}

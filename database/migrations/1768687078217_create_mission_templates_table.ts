import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mission_templates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('strategy_id')
        .unsigned()
        .references('id')
        .inTable('strategies')
        .onDelete('CASCADE')
        .notNullable()
      table.enum('type', ['post', 'story', 'reel', 'tuto']).notNullable()
      table.string('title', 255).notNullable()
      table.text('content_idea').notNullable()
      table.integer('order').notNullable().defaultTo(0)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

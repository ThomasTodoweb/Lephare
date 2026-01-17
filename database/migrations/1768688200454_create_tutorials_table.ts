import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tutorials'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('category_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('tutorial_categories')
        .onDelete('CASCADE')
      table.string('title', 255).notNullable()
      table.text('description').nullable()
      table.string('video_url', 500).nullable()
      table.text('content_text').nullable()
      table.integer('duration_minutes').notNullable().defaultTo(5)
      table.integer('order').notNullable().defaultTo(0)
      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['category_id', 'order'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

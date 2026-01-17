import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'weekly_reports'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.date('week_start_date').notNullable() // Start of the week (Monday)
      table.text('content').notNullable() // AI-generated content
      table.integer('missions_completed').notNullable().defaultTo(0)
      table.integer('tutorials_viewed').notNullable().defaultTo(0)
      table.integer('streak_at_end').notNullable().defaultTo(0)
      table.boolean('is_read').notNullable().defaultTo(false)

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // One report per user per week
      table.unique(['user_id', 'week_start_date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

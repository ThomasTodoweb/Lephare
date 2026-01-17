import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'statistics'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().notNullable().references('users.id').onDelete('CASCADE')
      table
        .enum('metric_type', [
          'posts_count',
          'stories_count',
          'reels_count',
          'tutorials_viewed',
          'missions_completed',
          'streak_max',
        ])
        .notNullable()
      table.integer('value').notNullable().defaultTo(0)
      table.date('recorded_at').notNullable()
      table.timestamp('created_at')

      // Unique constraint: one metric per type per day per user
      table.unique(['user_id', 'metric_type', 'recorded_at'])
      table.index(['user_id', 'recorded_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

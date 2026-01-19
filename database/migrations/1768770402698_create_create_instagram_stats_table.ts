import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'instagram_stats'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().notNullable().references('users.id').onDelete('CASCADE')

      // Follower metrics
      table.integer('followers_count').notNullable().defaultTo(0)
      table.integer('followers_growth_daily').defaultTo(0)
      table.integer('followers_growth_weekly').defaultTo(0)
      table.integer('followers_growth_monthly').defaultTo(0)

      // Engagement metrics (aggregated over period)
      table.integer('total_impressions').notNullable().defaultTo(0)
      table.integer('total_reach').notNullable().defaultTo(0)
      table.integer('total_likes').notNullable().defaultTo(0)
      table.integer('total_comments').notNullable().defaultTo(0)
      table.integer('total_shares').notNullable().defaultTo(0)
      table.integer('total_saves').notNullable().defaultTo(0)
      table.decimal('average_engagement_rate', 5, 2).defaultTo(0)

      // Post count for this period
      table.integer('posts_count').notNullable().defaultTo(0)

      // Period tracking
      table.date('recorded_at').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Unique constraint: one record per user per day
      table.unique(['user_id', 'recorded_at'])
      table.index(['user_id', 'recorded_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

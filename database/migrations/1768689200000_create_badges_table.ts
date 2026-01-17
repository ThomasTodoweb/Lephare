import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'badges'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 100).notNullable()
      table.string('slug', 100).notNullable().unique()
      table.text('description').nullable()
      table.string('icon', 50).notNullable() // Emoji icon
      table.string('criteria_type', 50).notNullable() // e.g., 'missions_completed', 'streak_days', 'tutorials_viewed'
      table.integer('criteria_value').notNullable() // e.g., 5, 10, 20
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

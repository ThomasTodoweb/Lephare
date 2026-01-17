import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'badge_unlocks'

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
      table
        .integer('badge_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('badges')
        .onDelete('CASCADE')
      table.timestamp('unlocked_at').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // User can only unlock a badge once
      table.unique(['user_id', 'badge_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

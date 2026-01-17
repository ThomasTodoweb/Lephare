import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'push_subscriptions'

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
      table.text('endpoint').notNullable().unique()
      table.text('p256dh_key').notNullable() // Public key
      table.text('auth_key').notNullable() // Auth secret
      table.boolean('is_active').notNullable().defaultTo(true)
      table.string('reminder_time', 5).notNullable().defaultTo('10:00') // HH:MM format

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

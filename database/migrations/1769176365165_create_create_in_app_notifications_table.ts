import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'in_app_notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('title', 255).notNullable()
      table.text('body').notNullable()
      table.string('type', 50).notNullable().defaultTo('general')
      table.json('data').nullable()
      table.timestamp('read_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.index(['user_id', 'read_at'], 'idx_notifications_user_read')
      table.index(['user_id', 'created_at'], 'idx_notifications_user_created')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'missions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()
      table
        .integer('mission_template_id')
        .unsigned()
        .references('id')
        .inTable('mission_templates')
        .onDelete('CASCADE')
        .notNullable()
      table.enum('status', ['pending', 'completed', 'skipped']).notNullable().defaultTo('pending')
      table.timestamp('assigned_at').notNullable()
      table.timestamp('completed_at').nullable()
      table.boolean('used_pass').notNullable().defaultTo(false)
      table.boolean('used_reload').notNullable().defaultTo(false)
      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Index for quick lookup of user's daily mission
      table.index(['user_id', 'assigned_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

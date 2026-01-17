import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tutorial_completions'

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
        .integer('tutorial_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('tutorials')
        .onDelete('CASCADE')
      table.timestamp('completed_at').notNullable()
      table.enum('feedback', ['useful', 'not_useful']).nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // User can only complete a tutorial once
      table.unique(['user_id', 'tutorial_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

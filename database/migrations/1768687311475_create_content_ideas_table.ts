import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'content_ideas'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('mission_template_id')
        .unsigned()
        .references('id')
        .inTable('mission_templates')
        .onDelete('CASCADE')
        .notNullable()
      table.text('suggestion_text').notNullable()
      table.text('photo_tips').nullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

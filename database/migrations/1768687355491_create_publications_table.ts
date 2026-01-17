import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'publications'

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
        .integer('mission_id')
        .unsigned()
        .references('id')
        .inTable('missions')
        .onDelete('SET NULL')
        .nullable()
      table.string('image_path', 500).notNullable()
      table.text('caption').notNullable()
      table.text('ai_generated_caption').nullable()
      table.enum('status', ['draft', 'pending', 'published', 'failed']).notNullable().defaultTo('draft')
      table.string('later_media_id', 255).nullable()
      table.string('instagram_post_id', 255).nullable()
      table.timestamp('published_at').nullable()
      table.text('error_message').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

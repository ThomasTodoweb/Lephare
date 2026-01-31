import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notion_ideas'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Notion reference
      table.string('notion_page_id', 100).notNullable().unique()

      // Titles
      table.string('original_title', 500).notNullable()
      table.string('ai_generated_title', 500).nullable()

      // Content type
      table.enum('content_type', ['post', 'story', 'reel', 'carousel']).notNullable()

      // Stored media paths (JSONB array of local file paths)
      table.jsonb('media_paths').notNullable().defaultTo('[]')

      // Media types for each path ('image' or 'video')
      table.jsonb('media_types').notNullable().defaultTo('[]')

      // Client info from Notion
      table.string('client_notion_id', 100).nullable()
      table.string('client_name', 255).nullable()

      // Original publication date from Notion
      table.timestamp('notion_publication_date').nullable()

      // Status for admin workflow
      table.enum('status', ['pending', 'reviewed', 'approved', 'rejected', 'converted'])
        .notNullable()
        .defaultTo('pending')

      // If converted to ContentIdea
      table.integer('content_idea_id').nullable().references('id').inTable('content_ideas').onDelete('SET NULL')

      // Admin notes
      table.text('admin_notes').nullable()

      // Tags added by admin (JSONB array)
      table.jsonb('tags').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Indexes
      table.index('status')
      table.index('content_type')
      table.index('client_notion_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

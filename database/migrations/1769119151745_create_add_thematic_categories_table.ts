import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'thematic_categories'

  async up() {
    // Create thematic categories table
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 100).notNullable().unique()
      table.string('slug', 100).notNullable().unique()
      table.string('icon', 10).nullable() // Emoji or icon
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })

    // Add thematic_category_id to mission_templates
    this.schema.alterTable('mission_templates', (table) => {
      table
        .integer('thematic_category_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('thematic_categories')
        .onDelete('SET NULL')
    })

    // Modify content_ideas: make mission_template_id nullable and add new columns
    this.schema.alterTable('content_ideas', (table) => {
      // Add content_types as JSON array (post, story, reel, carousel)
      table.json('content_types').nullable()
      // Add thematic_category_ids as JSON array of category IDs
      table.json('thematic_category_ids').nullable()
      // Add a title for the idea
      table.string('title', 200).nullable()
    })

    // Make mission_template_id nullable (separate step for SQLite compatibility)
    this.schema.raw(`
      ALTER TABLE content_ideas
      DROP CONSTRAINT IF EXISTS content_ideas_mission_template_id_foreign
    `)
  }

  async down() {
    // Remove columns from content_ideas
    this.schema.alterTable('content_ideas', (table) => {
      table.dropColumn('content_types')
      table.dropColumn('thematic_category_ids')
      table.dropColumn('title')
    })

    // Remove thematic_category_id from mission_templates
    this.schema.alterTable('mission_templates', (table) => {
      table.dropColumn('thematic_category_id')
    })

    // Drop thematic_categories table
    this.schema.dropTable(this.tableName)
  }
}

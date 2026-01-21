import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mission_templates'

  async up() {
    // Knex uses check constraints for enums, not PostgreSQL native enums
    // We need to drop and recreate the constraint with new values
    this.schema.alterTable(this.tableName, (table) => {
      // Drop the existing type column and recreate with new values
      table.dropColumn('type')
    })

    this.schema.alterTable(this.tableName, (table) => {
      // Recreate with all mission types including engagement and carousel
      table.enum('type', ['post', 'carousel', 'story', 'reel', 'tuto', 'engagement']).notNullable().defaultTo('post')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('type')
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.enum('type', ['post', 'story', 'reel', 'tuto']).notNullable()
    })
  }
}

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'content_ideas'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // JSON array of restaurant types: ['brasserie', 'gastronomique', etc.]
      // If empty/null, the idea applies to ALL restaurant types
      table.json('restaurant_tags').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('restaurant_tags')
    })
  }
}

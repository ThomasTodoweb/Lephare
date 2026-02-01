import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mission_templates'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // When true, missions from this template will use a random matching idea's media as background
      table.boolean('use_random_idea_background').defaultTo(false).notNullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('use_random_idea_background')
    })
  }
}

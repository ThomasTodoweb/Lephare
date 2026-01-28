import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'content_ideas'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('mission_template_id').unsigned().nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('mission_template_id').unsigned().notNullable().alter()
    })
  }
}

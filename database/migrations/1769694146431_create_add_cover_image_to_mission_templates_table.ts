import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mission_templates'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('cover_image_path', 500).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('cover_image_path')
    })
  }
}

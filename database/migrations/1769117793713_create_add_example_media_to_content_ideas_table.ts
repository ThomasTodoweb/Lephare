import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'content_ideas'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Path to the example media file (image or video)
      table.string('example_media_path', 500).nullable()
      // Type of media: 'image' or 'video'
      table.string('example_media_type', 10).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('example_media_path')
      table.dropColumn('example_media_type')
    })
  }
}

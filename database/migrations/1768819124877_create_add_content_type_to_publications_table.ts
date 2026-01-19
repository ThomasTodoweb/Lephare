import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'publications'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Content type: post, carousel, reel, story
      table.string('content_type', 20).defaultTo('post').notNullable()

      // JSON array of media items for carousel/reel
      table.text('media_items').nullable()

      // For reels: share to feed
      table.boolean('share_to_feed').defaultTo(false)

      // For reels: cover image
      table.string('cover_image_path', 500).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('content_type')
      table.dropColumn('media_items')
      table.dropColumn('share_to_feed')
      table.dropColumn('cover_image_path')
    })
  }
}

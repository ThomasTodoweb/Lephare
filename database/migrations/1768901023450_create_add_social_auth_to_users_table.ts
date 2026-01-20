import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Google OAuth
      table.string('google_id').nullable().unique()
      // Apple Sign In
      table.string('apple_id').nullable().unique()
      // Avatar from social provider
      table.string('avatar_url').nullable()
      // Make password nullable for social auth users
      // Password will be null for users who only use social auth
    })

    // Allow password to be nullable (already nullable but ensure it)
    this.defer(async (db) => {
      await db.rawQuery('ALTER TABLE users ALTER COLUMN password DROP NOT NULL;')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('google_id')
      table.dropColumn('apple_id')
      table.dropColumn('avatar_url')
    })
  }
}

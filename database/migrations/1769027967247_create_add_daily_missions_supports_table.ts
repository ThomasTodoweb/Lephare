import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'missions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Slot number identifies each mission of the day (1, 2, 3)
      table.integer('slot_number').unsigned().notNullable().defaultTo(1)
      // Mark the recommended mission for the day
      table.boolean('is_recommended').notNullable().defaultTo(false)
      // Composite index for fast daily missions lookup
      table.index(['user_id', 'assigned_at', 'slot_number'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['user_id', 'assigned_at', 'slot_number'])
      table.dropColumn('slot_number')
      table.dropColumn('is_recommended')
    })
  }
}

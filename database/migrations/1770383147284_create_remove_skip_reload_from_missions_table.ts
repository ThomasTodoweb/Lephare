import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'missions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('used_pass')
      table.dropColumn('used_reload')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('used_pass').defaultTo(false)
      table.boolean('used_reload').defaultTo(false)
    })
  }
}

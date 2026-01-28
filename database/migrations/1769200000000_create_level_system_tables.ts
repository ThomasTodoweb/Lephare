import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Add XP columns to users table
    this.schema.alterTable('users', (table) => {
      table.integer('xp_total').defaultTo(0).notNullable()
      table.integer('current_level').defaultTo(1).notNullable()
    })

    // Create level_thresholds table
    this.schema.createTable('level_thresholds', (table) => {
      table.increments('id')
      table.integer('level').notNullable().unique()
      table.integer('xp_required').notNullable()
      table.string('name', 50).nullable()
      table.string('icon', 10).nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })

    // Create xp_actions table
    this.schema.createTable('xp_actions', (table) => {
      table.increments('id')
      table.string('action_type', 50).notNullable().unique()
      table.integer('xp_amount').notNullable()
      table.string('description', 255).nullable()
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })

    // Add required_level to tutorials table
    this.schema.alterTable('tutorials', (table) => {
      table.integer('required_level').defaultTo(1).notNullable()
    })
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropColumn('xp_total')
      table.dropColumn('current_level')
    })

    this.schema.dropTable('level_thresholds')
    this.schema.dropTable('xp_actions')

    this.schema.alterTable('tutorials', (table) => {
      table.dropColumn('required_level')
    })
  }
}

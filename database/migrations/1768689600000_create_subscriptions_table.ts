import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'subscriptions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().notNullable().references('users.id').onDelete('CASCADE')
      table.string('stripe_customer_id').nullable()
      table.string('stripe_subscription_id').nullable()
      table.string('stripe_price_id').nullable()
      table
        .enum('plan_type', ['free_trial', 'monthly', 'yearly'])
        .notNullable()
        .defaultTo('free_trial')
      table
        .enum('status', ['active', 'canceled', 'past_due', 'incomplete', 'trialing'])
        .notNullable()
        .defaultTo('trialing')
      table.timestamp('trial_ends_at').nullable()
      table.timestamp('current_period_start').nullable()
      table.timestamp('current_period_end').nullable()
      table.timestamp('canceled_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.unique(['user_id'])
      table.index(['stripe_customer_id'])
      table.index(['stripe_subscription_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

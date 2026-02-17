import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Step 1: Delete duplicate missions, keeping the oldest (lowest id) per (user_id, slot_number, date)
    await this.db.rawQuery(`
      DELETE FROM missions
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM missions
        GROUP BY user_id, slot_number, assigned_at::date
      )
    `)

    // Step 2: Add unique functional index to prevent future duplicates
    // One mission per user per slot per day
    await this.db.rawQuery(`
      CREATE UNIQUE INDEX idx_missions_user_slot_date
      ON missions (user_id, slot_number, (assigned_at::date))
    `)
  }

  async down() {
    await this.db.rawQuery(`
      DROP INDEX IF EXISTS idx_missions_user_slot_date
    `)
  }
}

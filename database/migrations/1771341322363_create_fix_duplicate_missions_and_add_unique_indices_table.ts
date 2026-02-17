import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Step 1: Delete duplicate missions, keeping the oldest (lowest id) per (user_id, slot_number, date)
    await this.db.rawQuery(`
      DELETE FROM missions
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM missions
        GROUP BY user_id, slot_number, (assigned_at AT TIME ZONE 'UTC')::date
      )
    `)

    // Step 2: Create an immutable helper function for date extraction
    // PostgreSQL requires IMMUTABLE functions for unique index expressions
    // Since all timestamps are stored in UTC, this is safe
    await this.db.rawQuery(`
      CREATE OR REPLACE FUNCTION mission_date(ts timestamptz)
      RETURNS date AS $$
        SELECT (ts AT TIME ZONE 'UTC')::date;
      $$ LANGUAGE sql IMMUTABLE PARALLEL SAFE
    `)

    // Step 3: Add unique functional index using the immutable function
    // One mission per user per slot per day
    await this.db.rawQuery(`
      CREATE UNIQUE INDEX idx_missions_user_slot_date
      ON missions (user_id, slot_number, mission_date(assigned_at))
    `)
  }

  async down() {
    await this.db.rawQuery(`
      DROP INDEX IF EXISTS idx_missions_user_slot_date
    `)
    await this.db.rawQuery(`
      DROP FUNCTION IF EXISTS mission_date(timestamptz)
    `)
  }
}

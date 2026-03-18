import { query } from './db';

export const ensureBookingsSchema = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS specialist_slots (
      id SERIAL PRIMARY KEY,
      specialist_id INTEGER NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
      starts_at TIMESTAMPTZ NOT NULL,
      ends_at TIMESTAMPTZ NOT NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      is_booked BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (ends_at > starts_at),
      UNIQUE (specialist_id, starts_at, ends_at)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      specialist_id INTEGER NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
      parent_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      slot_id INTEGER NOT NULL UNIQUE REFERENCES specialist_slots(id) ON DELETE RESTRICT,
      child_name VARCHAR(255) NOT NULL,
      child_birth_date DATE,
      comment TEXT NOT NULL DEFAULT '',
      status VARCHAR(40) NOT NULL DEFAULT 'pending',
      cancel_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (status IN ('pending', 'confirmed', 'cancelled_by_parent', 'cancelled_by_specialist', 'completed', 'no_show'))
    )
  `);

  await query('CREATE INDEX IF NOT EXISTS idx_specialist_slots_specialist_starts ON specialist_slots(specialist_id, starts_at)');
  await query('CREATE INDEX IF NOT EXISTS idx_appointments_parent_created ON appointments(parent_user_id, created_at DESC)');
  await query('CREATE INDEX IF NOT EXISTS idx_appointments_specialist_created ON appointments(specialist_id, created_at DESC)');
};

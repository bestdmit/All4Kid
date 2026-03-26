import { query } from './db';

export const ensureFavoritesSchema = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS user_favorite_specialists (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      specialist_id INTEGER NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, specialist_id)
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_user_favorite_specialists_user_id
      ON user_favorite_specialists(user_id)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_user_favorite_specialists_specialist_id
      ON user_favorite_specialists(specialist_id)
  `);
};

import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'kids_specialists',
  password: process.env.DB_PASSWORD || 'password',
  port: Number(process.env.DB_PORT) || 5432,
});


export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const connectDB = async () => {
  try {
    console.log(`Connecting to DB at ${process.env.DB_HOST}:${process.env.DB_PORT} as ${process.env.DB_USER}`);
    const client = await pool.connect();
    console.log('PostgreSQL connected');

    const result = await client.query('SELECT COUNT(*) FROM specialists');
    console.log(`В базе ${result.rows[0].count} специалистов`);

    client.release();
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    process.exit(1);
  }
};



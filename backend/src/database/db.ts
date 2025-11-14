import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',        
  host: 'localhost',       
  database: 'kids_specialists', 
  password: 'password',    
  port: 5432,              
});


export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const connectDB = async () => {
  try {
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



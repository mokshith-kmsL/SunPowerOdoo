import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Create a connection pool.
// A pool keeps multiple connections open so the app doesn't have to
// reconnect to the database on every request — much faster.
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'sunpower_db',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD,
});

// This fires whenever a new connection is made to the DB
pool.on('connect', () => {
  console.log('Connected to PostgreSQL');
});

// This fires on unexpected DB errors
pool.on('error', (err) => {
  console.error('PostgreSQL error:', err.message);
});

// A simple helper so we can do: db.query(sql, [params])
// instead of importing the pool everywhere
const db = {
  query: (text, params) => pool.query(text, params),

  // Use this when you need to run multiple queries in a transaction.
  // A transaction means: if any query fails, ALL changes are rolled back.
  // This is important for operations like: create order + reserve inventory
  transaction: async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');        // Start transaction
      const result = await callback(client);
      await client.query('COMMIT');       // Save all changes
      return result;
    } catch (error) {
      await client.query('ROLLBACK');     // Undo all changes if something failed
      throw error;
    } finally {
      client.release();                   // Return connection to the pool
    }
  },
};

export default db;

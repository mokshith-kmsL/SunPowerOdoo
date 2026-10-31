import dotenv from 'dotenv';
dotenv.config(); // Load .env file first, before anything else

import app from './app.js';
import db  from './config/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test that we can actually connect to the database before starting
    await db.query('SELECT 1');
    console.log('Database connection OK');

    // Start listening for HTTP requests
    app.listen(PORT, () => {
      console.log(`SunPower API running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });

  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1); // Exit if DB is unreachable
  }
}

startServer();

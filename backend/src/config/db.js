const { Pool } = require('pg');
require('dotenv').config();

// The Pool automatically uses PGHOST, PGPORT, PGUSER, PGPASSWORD, and PGDATABASE 
// from your .env file, so you don't need to manually map them here!
const pool = new Pool({
  max: 20, // maximum number of clients in the pool
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Whatever SQL and parameters I give to query(), pass them to pool.query().
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };

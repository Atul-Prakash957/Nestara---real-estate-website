const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => console.log('✅ PostgreSQL pool: new client connected'));
pool.on('error', (err) => {
  console.error('❌ Unexpected PG pool error', err);
  process.exit(-1);
});

const query = (text, params) => {
  const start = Date.now();
  return pool.query(text, params).then((res) => {
    if (process.env.NODE_ENV !== 'production') {
      const duration = Date.now() - start;
      console.log('SQL:', text.slice(0, 80), '| rows:', res.rowCount, '|', duration + 'ms');
    }
    return res;
  });
};

module.exports = { pool, query };

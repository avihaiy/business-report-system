const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Please set DATABASE_URL environment variable');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: databaseUrl, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(raw);
    await pool.query(`CREATE TABLE IF NOT EXISTS kv (key text PRIMARY KEY, value jsonb)`);
    await pool.query('BEGIN');
    for (const k of Object.keys(db)) {
      await pool.query('INSERT INTO kv(key,value) VALUES($1,$2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [k, db[k]]);
      console.log('Wrote', k);
    }
    await pool.query('COMMIT');
    console.log('Migration completed');
  } catch (e) {
    console.error('Migration failed', e);
    await pool.query('ROLLBACK').catch(()=>{});
  } finally {
    await pool.end();
  }
}

main();

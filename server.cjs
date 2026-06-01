const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SEED_FILE = path.join(DATA_DIR, 'seed.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SEED_FILE)) {
    throw new Error('Missing seed database file: ' + SEED_FILE);
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = fs.readFileSync(SEED_FILE, 'utf-8');
    fs.writeFileSync(DB_FILE, initial, 'utf-8');
  }
}

function loadDB() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to read database file:', error);
    return JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
  }
}

function loadSeed() {
  try {
    return JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
  } catch (error) {
    console.error('Failed to read seed file:', error);
    return { users: [], businesses: [], reports: [], notifs: [] };
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  return db;
}

const seed = loadSeed();

// Simple Postgres-backed key/value JSON storage if DATABASE_URL provided
let pgPool = null;
const usePostgres = !!process.env.DATABASE_URL;
if (usePostgres) {
  const { Pool } = require('pg');
  pgPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
  // ensure kv table exists
  (async () => {
    try {
      await pgPool.query(`CREATE TABLE IF NOT EXISTS kv (key text PRIMARY KEY, value jsonb)`);
      // If kv is empty, initialize with seed data
      const r = await pgPool.query("SELECT count(*)::int AS c FROM kv");
      if (r.rows[0].c === 0) {
        const initial = loadDB();
        await pgPool.query('BEGIN');
        for (const k of Object.keys(initial)) {
          await pgPool.query('INSERT INTO kv(key,value) VALUES($1,$2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [k, initial[k]]);
        }
        await pgPool.query('COMMIT');
      }
      console.log('Postgres KV storage ready');
    } catch (e) {
      console.error('Failed to initialize Postgres KV store', e);
    }
  })();
}

app.use(cors());
app.use(express.json());
// Serve built client if available
const DIST_DIR = path.join(__dirname, 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

async function loadDBAsync() {
  if (usePostgres) {
    try {
      const res = await pgPool.query('SELECT key,value FROM kv');
      const out = {};
      for (const row of res.rows) out[row.key] = row.value;
      // ensure keys exist
      return {
        users: out.users || seed.users,
        businesses: out.businesses || seed.businesses,
        reports: out.reports || seed.reports,
        notifs: out.notifs || seed.notifs
      };
    } catch (e) {
      console.error('Postgres load failed', e);
      return { users: seed.users, businesses: seed.businesses, reports: seed.reports, notifs: seed.notifs };
    }
  }
  return loadDB();
}

async function saveDBAsync(db) {
  if (usePostgres) {
    try {
      await pgPool.query('BEGIN');
      for (const k of Object.keys(db)) {
        await pgPool.query('INSERT INTO kv(key,value) VALUES($1,$2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [k, db[k]]);
      }
      await pgPool.query('COMMIT');
      return db;
    } catch (e) {
      await pgPool.query('ROLLBACK').catch(()=>{});
      console.error('Postgres save failed', e);
      throw e;
    }
  }
  return saveDB(db);
}

app.get('/api/:collection', async (req, res) => {
  const collection = req.params.collection;
  const db = await loadDBAsync();
  if (!Object.prototype.hasOwnProperty.call(db, collection)) {
    return res.status(404).json({ error: 'Collection not found' });
  }
  res.json(db[collection]);
});

app.put('/api/:collection', async (req, res) => {
  const collection = req.params.collection;
  const db = await loadDBAsync();
  if (!Object.prototype.hasOwnProperty.call(db, collection) || !Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Invalid collection or payload' });
  }
  db[collection] = req.body;
  await saveDBAsync(db);
  res.json(db[collection]);
});

app.post('/api/reset', async (req, res) => {
  await saveDBAsync(seed);
  res.json(seed);
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

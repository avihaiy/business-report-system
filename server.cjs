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

app.get('/api/:collection', (req, res) => {
  const collection = req.params.collection;
  const db = loadDB();
  if (!Object.prototype.hasOwnProperty.call(db, collection)) {
    return res.status(404).json({ error: 'Collection not found' });
  }
  res.json(db[collection]);
});

app.put('/api/:collection', (req, res) => {
  const collection = req.params.collection;
  const db = loadDB();
  if (!Object.prototype.hasOwnProperty.call(db, collection) || !Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Invalid collection or payload' });
  }
  db[collection] = req.body;
  saveDB(db);
  res.json(db[collection]);
});

app.post('/api/reset', (req, res) => {
  saveDB(seed);
  res.json(seed);
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

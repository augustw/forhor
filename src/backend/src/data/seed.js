const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { OllamaClient } = require('../OllamaClient');
const { forhorsTexter } = require('./forhor.data');

const dbDir = path.resolve(__dirname, '.');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'database.db');
const db = new sqlite3.Database(dbPath);
const ollamaClient = new OllamaClient();

function runSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        return reject(err);
      }
      resolve(this.lastID);
    });
  });
}

function getSingle(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        return reject(err);
      }
      resolve(row);
    });
  });
}

async function main() {
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS forhor (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          text TEXT NOT NULL,
          created DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        (err) => (err ? reject(err) : resolve())
      );
    });
  });

  await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS highlights (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          forhor_id INTEGER NOT NULL,
          highlight TEXT NOT NULL,
          FOREIGN KEY (forhor_id) REFERENCES forhor(id) ON DELETE CASCADE
        )`,
        (err) => (err ? reject(err) : resolve())
      );
    });
  });

  console.log('Database and tables are ready.');

  const row = await getSingle('SELECT COUNT(*) as count FROM forhor');
  const count = row ? row.count : 0;
  console.log('Antal förhör i databasen:', count);

  if (count === 0) {
    console.log('Seeding forhor table with sample data...');
    for (const text of forhorsTexter) {
      const forhorId = await runSql('INSERT INTO forhor (text) VALUES (?)', [text]);

      let highlights = [];
      try {
        highlights = await ollamaClient.extractHighlights(text);
      } catch (err) {
        console.error(`Error extracting highlights for "${text}":`, err);
      }

      console.log(`Sparar ${highlights.length} höjdpunkter för förhör #${forhorId}`);

      for (const highlight of highlights) {
        await runSql('INSERT INTO highlights (forhor_id, highlight) VALUES (?, ?)', [forhorId, highlight]);
      }
      console.log(`Förhör #${forhorId} och dess höjdpunkter sparade i databasen. Highlights:`, highlights);
    }
  }

  const allForhor = await new Promise((resolve, reject) => {
    db.all('SELECT * FROM forhor', (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });

  console.log('Förhör i databasen:', allForhor);
  db.close();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  db.close();
  process.exit(1);
});
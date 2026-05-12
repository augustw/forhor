const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.resolve(__dirname, '.');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'database.db');
const db = new sqlite3.Database(dbPath);

// Skapa tabeller om de inte finns
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS forhor (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      created DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      forhor_id INTEGER NOT NULL,
      highlight TEXT NOT NULL,
      FOREIGN KEY (forhor_id) REFERENCES forhor(id) ON DELETE CASCADE
    )
  `);
});

console.log('Seeding completed. Database and tables are ready.');

// select * from forhor
db.all("SELECT * FROM forhor", (err, rows) => {
  if (err) {
    console.error('Error fetching förhör:', err);
  } else {
    console.log('Förhör:', rows);
  }
});

db.close();
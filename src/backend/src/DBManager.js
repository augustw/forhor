const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

class DBManager {
  constructor() {
    const dbDir = path.resolve(__dirname, 'data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const dbPath = path.join(dbDir, 'database.db');
    this.db = new sqlite3.Database(dbPath);
  }

  saveForhorAndHighlights(prompt, text, highlights) {
    return new Promise((resolve, reject) => {
      const db = this.db;

      db.serialize(() => {
        db.run(`INSERT INTO forhor (text) VALUES (?)`, [text], function (err) {
          if (err) {
            return reject(err);
          }

          const forhorId = this.lastID;
          const stmt = db.prepare(`INSERT INTO highlights (forhor_id, highlight) VALUES (?, ?)`);

          for (const highlight of highlights) {
            stmt.run(forhorId, highlight);
          }

          stmt.finalize((finalizeErr) => {
            if (finalizeErr) {
              return reject(finalizeErr);
            }
            resolve({ forhorId });
          });
        });
      });
    });
  }
}

module.exports = { DBManager };

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

  getAllForhor() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT f.id, f.text, h.highlight
         FROM forhor f
         LEFT JOIN highlights h ON h.forhor_id = f.id
         ORDER BY f.id, h.id`,
        (err, rows) => {
          if (err) {
            return reject(err);
          }

          const grouped = new Map();

          for (const row of rows) {
            if (!grouped.has(row.id)) {
              grouped.set(row.id, {
                id: row.id,
                text: row.text,
                highlights: [],
              });
            }

            if (row.highlight != null) {
              grouped.get(row.id).highlights.push(row.highlight);
            }
          }

          resolve(Array.from(grouped.values()));
        }
      );
    });
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

  getAllForhorChunks() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT forhor_id, chunk_index, start_pos, end_pos, chunk, embedding FROM forhor_chunks ORDER BY forhor_id, chunk_index`,
        (err, rows) => {
          if (err) {
            return reject(err);
          }
          rows.map((row) => {
            row.embedding = this.bufferToEmbedding(row.embedding);
          });
          resolve(rows);
        }
      );
    });
  }

  bufferToEmbedding(buffer) {
  return new Float32Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.length / 4
  );
}
}

module.exports = { DBManager };

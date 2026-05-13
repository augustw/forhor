const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.resolve(__dirname, '.');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'database.db');
const db = new sqlite3.Database(dbPath);

function runSql(sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

async function main() {
  await runSql('PRAGMA foreign_keys = ON;');
  await runSql('DELETE FROM highlights;');
  await runSql('DELETE FROM forhor;');
  await runSql('VACUUM;');

  console.log('Database tables emptied. You can now rerun npm run seed.');
  db.close();
}

main().catch((err) => {
  console.error('Failed to unseed database:', err);
  db.close();
  process.exit(1);
});
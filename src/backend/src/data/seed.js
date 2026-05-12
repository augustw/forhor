import Database from "better-sqlite3";

const db = new Database('./src/data/database.db');

// Skapa tabeller om de inte finns
db.exec(`
    CREATE TABLE IF NOT EXISTS forhor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    created DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);
db.exec(`
    CREATE TABLE IF NOT EXISTS highlights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    forhor_id INTEGER NOT NULL,
    highlight TEXT NOT NULL,
    FOREIGN KEY (forhor_id) REFERENCES forhor(id) ON DELETE CASCADE
    )
`);

// Grundfyll tabellerna om de är tomma

const count = db
  .prepare("SELECT COUNT(*) as count FROM users")
  .get();

if (count.count === 0) {

} else {
  console.log("Databasen är redan initierad");
}
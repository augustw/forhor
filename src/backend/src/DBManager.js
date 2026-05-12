import Database from "better-sqlite3";

export class DBManager {
  db = new Database('./src/data/database.db');

  async saveForhorAndHighlights(prompt, text, highlights) {
    // Implement the logic to save the Forhor data to the database
    const forhorStmt = this.db.prepare(`INSERT INTO forhor (text) VALUES (?)`);
    const result = forhorStmt.run(text);
    const forhorId = result.lastInsertRowid;

    const highlightStmt = this.db.prepare(`INSERT INTO highlights (forhor_id, highlight) VALUES (?, ?)`);
    const insertHighlights = this.db.transaction((highlights) => {
      for (const highlight of highlights) {
        highlightStmt.run(forhorId, highlight);
      }
    });
    insertHighlights(highlights);
    
  }
}
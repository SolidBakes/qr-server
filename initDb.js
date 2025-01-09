// initDb.js
const { query } = require('./db');

async function initDB() {
  try {
    // Erstelle eine Tabelle codes, 
    // die den Code als Primary Key speichert und valid (boolean) hat.
    await query(`
      CREATE TABLE IF NOT EXISTS codes (
        code VARCHAR(50) PRIMARY KEY,
        valid BOOLEAN DEFAULT TRUE
      );
    `);
    console.log("Tabelle 'codes' wurde angelegt (falls sie noch nicht existierte).");
    process.exit(0);
  } catch (err) {
    console.error("Fehler beim Anlegen der Tabelle:", err);
    process.exit(1);
  }
}

initDB();

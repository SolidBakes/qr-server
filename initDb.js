const { query } = require('./db');

async function initDB() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS codes (
        code VARCHAR(50) PRIMARY KEY,
        valid BOOLEAN DEFAULT TRUE
      );
    `);
    console.log("Tabelle 'codes' wurde angelegt (falls nicht existierte).");
    process.exit(0);
  } catch (error) {
    console.error("Fehler beim Anlegen der Tabelle:", error);
    process.exit(1);
  }
}

initDB();

const { query } = require('./db');

const codes = [
  'C8DKAZ',
  'XGYB2P',
  'QG3Z7H',
  // ...
];

async function seedCodes() {
  try {
    for (let code of codes) {
      await query('INSERT INTO codes (code, valid) VALUES ($1, TRUE) ON CONFLICT (code) DO NOTHING', [code]);
    }
    console.log("Codes erfolgreich eingefügt (oder waren schon drin).");
    process.exit(0);
  } catch (err) {
    console.error("Fehler beim Befüllen der Codes:", err);
    process.exit(1);
  }
}

seedCodes();

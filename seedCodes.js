// seedCodes.js
const { query } = require('./db');

const codesToInsert = [
  'C8DKAZ',
  'XGYB2P',
  'QG3Z7H',
  'J6R1NB',
  'W2VX05',
  'LK7R4M',
  'MUC4SV',
  'PZ1QTF',
  'LND5RW',
  '4K9GCX',
  // ... bis du 40 oder mehr hast
];

async function seedCodes() {
  try {
    for (const code of codesToInsert) {
      // code einfügen. Falls er schon existiert -> nichts machen
      await query(
        'INSERT INTO codes (code, valid) VALUES ($1, true) ON CONFLICT (code) DO NOTHING',
        [code]
      );
    }
    console.log("Codes wurden eingefügt (oder waren schon da).");
    process.exit(0);
  } catch (err) {
    console.error("Fehler beim Einfügen:", err);
    process.exit(1);
  }
}

seedCodes();

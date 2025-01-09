// db.js
const { Pool } = require('pg');

// Pool konfigurieren; Connection String aus Umgebungsvariable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Für Render ggf. notwendig (Self-Signed Certs)
  }
});

// Eine kleine Hilfsfunktion, um einfache Queries auszuführen
async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

module.exports = { query };

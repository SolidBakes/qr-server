// db.js
const { Pool } = require('pg');

// Nutze die Umgebungsvariable DATABASE_URL
// Mit ssl: { rejectUnauthorized: false }, damit es auf Render klappt.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Einfache Hilfsfunktion zum Absetzen von Queries
async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

module.exports = { query };

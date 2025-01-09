// index.js
const express = require('express');
const { query } = require('./db'); // Unsere Datenbank-Hilfsfunktion

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/admin/codes', async (req, res) => {
  try {
    // Alle Codes, optional nur valid = true
    const result = await query('SELECT code, valid FROM codes ORDER BY code');
    res.json(result.rows);  // Ausgabe als JSON
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Abrufen der Codes");
  }
});


app.get('/redeem', async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.send("Kein Token angegeben");
  }

  try {
    // 1. Aus DB lesen, ob es den Code gibt
    const result = await query(
      'SELECT valid FROM codes WHERE code = $1',
      [token]
    );

    if (result.rowCount === 0) {
      // Kein Eintrag => ungültiger Code
      return res.send("Ungültiger Code");
    }

    const { valid } = result.rows[0];

    if (!valid) {
      // Code existiert, ist aber schon false => bereits eingelöst
      return res.send("Dieser Code wurde bereits eingelöst.");
    }

    // 2. Noch gültig => auf false setzen und melden, dass er eingelöst wurde
    await query(
      'UPDATE codes SET valid = false WHERE code = $1',
      [token]
    );

    return res.send("Gutschein erfolgreich eingelöst!");
  } catch (err) {
    console.error("Fehler beim Einlösen:", err);
    return res.status(500).send("Fehler beim Einlösen des Codes");
  }
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

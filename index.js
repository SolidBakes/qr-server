// index.js
const express = require('express');
const { query } = require('./db'); // Unsere Datenbank-Hilfsfunktion
const bodyParser = require('body-parser');  // oder express.json()

const app = express();
const PORT = process.env.PORT || 3000;

// JSON-Parsing aktivieren (damit POST mit JSON-Body gelesen werden kann)
app.use(express.json()); 
// oder: app.use(bodyParser.json());

// POST-Route /admin/addcodes
app.post('/admin/addcodes', async (req, res) => {
  try {
    // "codes" ist ein Array, z. B. ["C8DKAZ", "XGYB2P", ...]
    const codesArray = req.body.codes;

    if (!codesArray || !Array.isArray(codesArray) || codesArray.length === 0) {
      return res.status(400).send("Bitte ein Array 'codes' im Body senden.");
    }

    // INSERT in DB (Schleife oder Bulk)
    for (const code of codesArray) {
      await query(
        `INSERT INTO codes (code, valid) 
         VALUES ($1, true) 
         ON CONFLICT (code) DO NOTHING`,
        [code]
      );
    }

    res.send(`Es wurden ${codesArray.length} Codes hinzugefügt (bzw. ignoriert, wenn schon vorhanden).`);
  } catch (err) {
    console.error("Fehler beim Hinzufügen mehrerer Codes:", err);
    res.status(500).send("Interner Serverfehler");
  }
});

// GET-Route /admin/addcode (einzelner Code im Query)
app.get('/admin/addcode', async (req, res) => {
  const token = req.query.token; // z.B. ?token=Z99999
  if (!token) {
    return res.send("Bitte Code als token-Query angeben, z.B. ?token=Z99999");
  }

  try {
    // Insert in die Datenbank
    await query('INSERT INTO codes (code, valid) VALUES ($1, true) ON CONFLICT (code) DO NOTHING', [token]);
    return res.send(`Code '${token}' wurde hinzugefügt (falls er nicht schon existierte).`);
  } catch (err) {
    console.error("Fehler beim Hinzufügen des Codes:", err);
    return res.status(500).send("Fehler beim Hinzufügen des Codes");
  }
});

// GET-Route /admin/codes (alle Codes abfragen)
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

// GET-Route /redeem (Einlösen eines Codes)
app.get('/redeem', async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.send("Kein Token angegeben");
  }

  try {
    // 1. Check, ob der Code in der DB existiert
    const result = await query('SELECT valid FROM codes WHERE code = $1', [token]);

    if (result.rowCount === 0) {
      // Kein Eintrag => ungültiger Code
      return res.send("Ungültiger Code");
    }

    const { valid } = result.rows[0];
    if (!valid) {
      // Code existiert, ist aber schon false => bereits eingelöst
      return res.send("Dieser Code wurde bereits eingelöst.");
    }

    // 2. Noch gültig => auf false setzen und Erfolg melden
    await query('UPDATE codes SET valid = false WHERE code = $1', [token]);
    return res.send("Gutschein erfolgreich eingelöst!");
  } catch (err) {
    console.error("Fehler beim Einlösen:", err);
    return res.status(500).send("Fehler beim Einlösen des Codes");
  }
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

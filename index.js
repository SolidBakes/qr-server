// index.js
const express = require('express');
const adminAuth = require('./adminAuth'); // die Middleware
const { query } = require('./db'); // Unsere Datenbank-Hilfsfunktion
const bodyParser = require('body-parser');  // oder express.json()

const app = express();
const PORT = process.env.PORT || 3000;

// JSON-Parsing aktivieren (damit POST mit JSON-Body gelesen werden kann)
app.use(express.json()); 
// oder: app.use(bodyParser.json());


// Alle Routen unter /admin schützen:
app.use('/admin', adminAuth);


app.get('/admin/removemultiple', async (req, res) => {
  try {
    const codesParam = req.query.codes;
    if (!codesParam) {
      return res.send("Keine Codes übergeben. Beispiel: /admin/removemultiple?codes=C8DKAZ,XGYB2P");
    }
    const codesArray = codesParam.split(",").map(c => c.trim()).filter(Boolean);
    if (codesArray.length === 0) {
      return res.send("Keine Codes vorhanden (nach dem Split).");
    }

    // Variante: Schleife oder "IN" (Bulk-Löschen)
    for (const code of codesArray) {
      await query('DELETE FROM codes WHERE code = $1', [code]);
    }

    return res.send(`Die folgenden Codes wurden (falls vorhanden) gelöscht: ${codesArray.join(", ")}`);
  } catch (err) {
    console.error("Fehler beim Entfernen mehrerer Codes:", err);
    return res.status(500).send("Fehler beim Entfernen mehrerer Codes");
  }
});



app.get('/admin/addmultiple', async (req, res) => {
  try {
    // "codes" ist ein kommaseparierter String in der Query, z. B.:
    // ?codes=C8DKAZ,XGYB2P,QG3Z7H
    const codesParam = req.query.codes; 

    if (!codesParam) {
      return res.send("Keine Codes übergeben. Beispiel: /admin/addmultiple?codes=C8DKAZ,XGYB2P");
    }

    // String in Array umwandeln
    const codesArray = codesParam.split(",").map(c => c.trim()).filter(Boolean);

    if (codesArray.length === 0) {
      return res.send("Keine Codes vorhanden (nach dem Split).");
    }

    // INSERT in DB (pro Code einzeln oder als Bulk)
    for (const code of codesArray) {
      await query(
        `INSERT INTO codes (code, valid) 
         VALUES ($1, true) 
         ON CONFLICT (code) DO NOTHING`,
        [code]
      );
    }

    // Rückmeldung
    return res.send(`Die folgenden Codes wurden hinzugefügt (sofern sie nicht schon existierten): 
                     ${codesArray.join(", ")}`);
  } catch (err) {
    console.error("Fehler beim Einfügen mehrerer Codes:", err);
    return res.status(500).send("Fehler beim Einfügen mehrerer Codes");
  }
});


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

app.get('/redeem', async (req, res) => {
  const token = req.query.token;
  if (!token) {
    // Kein Token angegeben → Zeige rote Fehlerseite
    return res.send(`
      <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: red;
            font-family: Arial, sans-serif;
          }
          .message {
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            color: white;
            font-size: 2em;
            height: 100vh; /* Vollbildhöhe */
            word-wrap: break-word;
            margin: 0 20px; /* etwas Rand */
          }
        </style>
      </head>
      <body>
        <div class="message">
          Fehler: Kein Token angegeben!
        </div>
      </body>
      </html>
    `);
  }

  try {
    // 1. Prüfen, ob Code existiert
    const result = await query('SELECT valid FROM codes WHERE code = $1', [token]);

    if (result.rowCount === 0) {
      // Ungültiger Code → rote Fehlermeldung
      return res.send(`
        <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: red;
              font-family: Arial, sans-serif;
            }
            .message {
              display: flex;
              justify-content: center;
              align-items: center;
              text-align: center;
              color: white;
              font-size: 2em;
              height: 100vh;
              word-wrap: break-word;
              margin: 0 20px;
            }
          </style>
        </head>
        <body>
          <div class="message">
            Ungültiger Code!
          </div>
        </body>
        </html>
      `);
    }

    const { valid } = result.rows[0];
    if (!valid) {
      // Code bereits eingelöst → rote Seite
      return res.send(`
        <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: red;
              font-family: Arial, sans-serif;
            }
            .message {
              display: flex;
              justify-content: center;
              align-items: center;
              text-align: center;
              color: white;
              font-size: 2em;
              height: 100vh;
              word-wrap: break-word;
              margin: 0 20px;
            }
          </style>
        </head>
        <body>
          <div class="message">
            Dieser Code wurde bereits eingelöst!
          </div>
        </body>
        </html>
      `);
    }

    // 2. Code noch gültig → auf false setzen
    await query('UPDATE codes SET valid = false WHERE code = $1', [token]);

    // Erfolgsseite → grüner Hintergrund
    return res.send(`
      <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: green;
            font-family: Arial, sans-serif;
          }
          .message {
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            color: white;
            font-size: 2em;
            height: 100vh;
            word-wrap: break-word;
            margin: 0 20px;
          }
        </style>
      </head>
      <body>
        <div class="message">
          Gutschein erfolgreich eingelöst!
        </div>
      </body>
      </html>
    `);

  } catch (err) {
    console.error("Fehler beim Einlösen:", err);
    // Bei unerwarteten Fehlern → rote Seite
    return res.status(500).send(`
      <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: red;
            font-family: Arial, sans-serif;
          }
          .message {
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            color: white;
            font-size: 2em;
            height: 100vh;
            word-wrap: break-word;
            margin: 0 20px;
          }
        </style>
      </head>
      <body>
        <div class="message">
          Server-Fehler beim Einlösen des Codes.
        </div>
      </body>
      </html>
    `);
  }
});


// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

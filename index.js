// index.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// codes.json einlesen (einmal beim Start)
let codes = {};
try {
  const data = fs.readFileSync(path.join(__dirname, 'codes.json'), 'utf-8');
  codes = JSON.parse(data);
  console.log("codes.json geladen:", codes);
} catch (err) {
  console.error("Fehler beim Laden von codes.json:", err);
}

// Route zum Einlösen
app.get('/redeem', (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.send("Kein Token angegeben");
  }

  // Prüfen, ob Token in codes vorhanden
  if (codes[token] === undefined) {
    return res.send("Ungültiger Code");
  }

  // Prüfen, ob noch true
  if (codes[token] === true) {
    // Einlösen -> auf false setzen
    codes[token] = false;

    // codes.json aktualisieren, damit der Status gespeichert bleibt
    fs.writeFileSync(
      path.join(__dirname, 'codes.json'),
      JSON.stringify(codes, null, 2)
    );

    return res.send("Gutschein erfolgreich eingelöst!");
  } else {
    return res.send("Dieser Code wurde bereits eingelöst.");
  }
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

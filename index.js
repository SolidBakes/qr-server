const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Codes laden
let codes = {};
try {
  const data = fs.readFileSync(path.join(__dirname, 'codes.json'), 'utf-8');
  codes = JSON.parse(data);
} catch (err) {
  console.error('Fehler beim Laden der codes.json', err);
}

// Route zum Einlösen des Codes
app.get('/redeem', (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.send('Kein Token angegeben');
  }
  
  if (codes[token] === undefined) {
    return res.send('Ungültiger Code.');
  }

  if (codes[token] === true) {
    // Code ist noch gültig
    codes[token] = false;

    // Speichern in codes.json
    fs.writeFileSync(path.join(__dirname, 'codes.json'), JSON.stringify(codes, null, 2));
    
    return res.send('Gutschein erfolgreich eingelöst!');
  } else {
    return res.send('Dieser Code wurde bereits eingelöst.');
  }
});

// Start des Servers
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

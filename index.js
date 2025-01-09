const express = require('express');
const { query } = require('./db'); // unsere Funktion aus db.js

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/redeem', async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.send('Kein Token angegeben');
  }

  try {
    // 1) Schauen, ob der Code existiert und valid=true ist
    const result = await query('SELECT valid FROM codes WHERE code = $1', [token]);
    if (result.rowCount === 0) {
      return res.send('Ungültiger Code');
    }

    const { valid } = result.rows[0];
    if (!valid) {
      return res.send('Dieser Code wurde bereits eingelöst.');
    }

    // 2) Wenn valid=true, Code entwerten (valid=false)
    await query('UPDATE codes SET valid = FALSE WHERE code = $1', [token]);
    return res.send('Gutschein erfolgreich eingelöst!');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Fehler beim Einlösen des Codes');
  }
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

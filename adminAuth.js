module.exports = (req, res, next) => {
  const auth = req.headers.authorization; // z. B. "Basic YWRtaW46czNjcjN0"
  if (!auth) {
    // Header fehlt → Auth anfordern
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Auth Required');
  }

  // Header sieht aus wie "Basic base64EncodedString"
  const [scheme, encoded] = auth.split(' ');
  if (scheme !== 'Basic') {
    return res.status(401).send('Invalid Auth Scheme');
  }

  // base64 dekodieren
  const buffer = Buffer.from(encoded, 'base64');
  const [user, pass] = buffer.toString().split(':');

  // Mit Env-Variablen vergleichen
  if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
    return next(); // alles ok, weiter zur Route
  } else {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Invalid Credentials');
  }
};

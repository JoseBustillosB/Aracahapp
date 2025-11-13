import admin from 'firebase-admin';

// Si ya inicializaste en index.js con applicationDefault, esto no hará doble init:
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export async function verifyFirebaseToken(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}



/*
// Middleware: verificacion de ID Token.
async function verifyFirebaseToken(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

*/
import { safeEqual, sessionValue } from '../lib/sign.js';

// POST {password} signs you in. DELETE signs you out.
export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', 'dbd_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
    return res.status(204).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  const pw = process.env.APP_PASSWORD;
  if (!pw) return res.status(500).json({ error: 'APP_PASSWORD is not set.' });
  const given = (req.body && req.body.password) || '';
  if (!safeEqual(given, pw)) return res.status(401).json({ error: 'Wrong password.' });
  res.setHeader('Set-Cookie', `dbd_session=${sessionValue()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 90}`);
  return res.status(204).end();
}

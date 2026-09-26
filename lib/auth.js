import { safeEqual, sessionValue } from './sign.js';

export function cookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
// You, signed in to the dashboard
export function isOwner(req) {
  const c = cookies(req).dbd_session;
  return !!c && safeEqual(c, sessionValue());
}
// Claude, reading with the read-only token
export function isReader(req) {
  const t = req.query?.token;
  return !!process.env.READ_TOKEN && !!t && safeEqual(t, process.env.READ_TOKEN);
}
// The scheduler (GitHub Actions or Vercel Cron)
export function isCron(req) {
  const h = req.headers.authorization || '';
  return !!process.env.CRON_SECRET && safeEqual(h, `Bearer ${process.env.CRON_SECRET}`);
}

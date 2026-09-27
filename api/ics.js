import { isOwner } from '../lib/auth.js';

// Only calendar hosts from Google and Microsoft. Anything else is refused, so this
// endpoint can't be used to make the server fetch arbitrary addresses.
const ALLOW = new Set(['calendar.google.com', 'outlook.live.com', 'outlook.office365.com', 'outlook.office.com']);
const MAX_BYTES = 8 * 1024 * 1024;

function parse(raw) {
  let s = String(raw || '').trim();
  if (s.toLowerCase().startsWith('webcal://')) s = 'https://' + s.slice(9);
  let u;
  try { u = new URL(s); } catch { return null; }
  return u.protocol === 'https:' && ALLOW.has(u.hostname) ? u : null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!isOwner(req)) return res.status(401).json({ error: 'Sign in first.' });
  let u = parse(req.query.url);
  if (!u) return res.status(400).json({ error: 'Paste a Google Calendar secret address or an Outlook ICS link.' });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    let r = await fetch(u, { redirect: 'manual', signal: ctrl.signal, headers: { 'User-Agent': 'DayByDatum/1.0' } });
    for (let i = 0; i < 3 && r.status >= 300 && r.status < 400; i++) {
      const next = parse(new URL(r.headers.get('location') || '', u).href);
      if (!next) return res.status(400).json({ error: 'That link redirected somewhere unexpected.' });
      u = next;
      r = await fetch(u, { redirect: 'manual', signal: ctrl.signal, headers: { 'User-Agent': 'DayByDatum/1.0' } });
    }
    if (r.status === 404 || r.status === 403) {
      return res.status(502).json({ error: 'The calendar service refused that link. It may have been reset, unpublished, or blocked by an admin.' });
    }
    if (!r.ok) return res.status(502).json({ error: `The calendar service answered ${r.status}.` });
    const text = await r.text();
    if (text.length > MAX_BYTES) return res.status(413).json({ error: 'That calendar is too large to import.' });
    if (!text.includes('BEGIN:VCALENDAR')) return res.status(422).json({ error: 'That link didn\u2019t return a calendar. Use the ICS or iCal address.' });
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    return res.status(200).send(text);
  } catch (e) {
    return res.status(504).json({ error: e.name === 'AbortError' ? 'The calendar took too long to respond. Try again.' : e.message });
  } finally {
    clearTimeout(timer);
  }
}

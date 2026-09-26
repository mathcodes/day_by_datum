import crypto from 'node:crypto';

function secret() {
  const s = process.env.APP_SECRET;
  if (!s || s.length < 32) throw new Error('APP_SECRET must be set to a random string of 32+ characters.');
  return s;
}
const mac = (data) => crypto.createHmac('sha256', secret()).update(data).digest('base64url');

export function safeEqual(a, b) {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Signed, expiring tokens for email buttons: {d: date, i: commitment id, s: 'done'|'missed', exp}
export function sign(obj) {
  const p = Buffer.from(JSON.stringify(obj)).toString('base64url');
  return `${p}.${mac(p)}`;
}
export function verify(tok) {
  if (typeof tok !== 'string' || !tok.includes('.')) return null;
  const [p, m] = tok.split('.');
  if (!safeEqual(m, mac(p))) return null;
  let o; try { o = JSON.parse(Buffer.from(p, 'base64url').toString()); } catch { return null; }
  if (o.exp && Date.now() > o.exp) return null;
  return o;
}

export const sessionValue = () => mac('session:v1');

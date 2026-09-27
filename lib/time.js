// Time helpers shared by the API. The dashboard has matching copies.
export const SLOTS = ['morning', 'midday', 'evening'];
export const SLOT_NAME = { morning: 'Morning', midday: 'Midday', evening: 'Evening' };
export const TIER = { device: 'Claude checks Apple Health', paper: 'Claude checks statements', word: 'On your word', event: 'Event' };

export function localNow(tz) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const p = {};
  for (const x of f.formatToParts(new Date())) p[x.type] = x.value;
  const h = Number(p.hour) % 24;
  return { key: `${p.year}-${p.month}-${p.day}`, mins: h * 60 + Number(p.minute), hhmm: `${String(h).padStart(2, '0')}:${p.minute}` };
}
export const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export function fmt12(t) { let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${ap}`; }
export function parseKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); }
export function addDays(k, n) { const d = parseKey(k); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export function fmtDate(k) { return parseKey(k).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' }); }

export function occurs(c, k) {
  if (c.since && k < c.since) return false;
  const d = parseKey(k); const wd = d.getUTCDay();
  if (c.freq === 'once') return !!c.date && c.date === k;
  if (c.freq === 'daily') return true;
  if (c.freq === 'weekdays') return wd >= 1 && wd <= 5;
  if (c.freq === 'monthly') {
    if (!c.day) return false;
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    return d.getUTCDate() === Math.min(c.day, last);
  }
  return false;
}

// A commitment with parts expands into one unit per part; log keys are "cId" or "cId.pId".
export function units(c) {
  return c.parts && c.parts.length
    ? c.parts.map((p) => ({ key: `${c.id}.${p.id}`, title: p.title, c, sub: true }))
    : [{ key: c.id, title: c.title, c, sub: false }];
}
export function unitTitle(state, key) {
  const [cid, pid] = key.split('.');
  const c = state.commitments.find((x) => x.id === cid);
  if (!c) return 'That commitment was deleted';
  if (!pid) return c.title;
  const p = (c.parts || []).find((x) => x.id === pid);
  return `${c.title}: ${p ? p.title : '(deleted part)'}`;
}

import { redis } from './redis.js';

const KEY = 'dbd:state';
const since = '2026-09-26';
const c = (id, title, tier, slot, freq, extra = {}) => ({ id, title, tier, slot, freq, since, ...extra });

export const SEED = {
  rev: 0,
  settings: { tz: 'America/New_York', checkpoints: { morning: '09:00', midday: '13:00', evening: '20:00' } },
  commitments: [
    c('c1', 'Slept 7+ hours', 'device', 'morning', 'daily'),
    c('c2', 'Morning walk with the dog', 'word', 'morning', 'daily'),
    c('c3', "Write down today's top 3", 'word', 'morning', 'weekdays'),
    c('c4', '5,000 steps by lunch', 'device', 'midday', 'daily'),
    c('c5', 'Check bank balance and upcoming bills', 'word', 'midday', 'daily'),
    c('c9', 'Chase Amazon Visa payment', 'paper', 'midday', 'monthly', { day: null, amount: '' }),
    c('c10', 'Buzzy loan payment', 'paper', 'midday', 'monthly', { day: null, amount: '' }),
    c('c11', 'Rent', 'paper', 'midday', 'monthly', { day: null, amount: '' }),
    c('c6', '30 exercise minutes', 'device', 'evening', 'daily'),
    c('c7', '10,000 steps', 'device', 'evening', 'daily'),
    c('c8', 'Guitar practice, 20 minutes', 'word', 'evening', 'daily'),
  ],
  log: {},
};

export async function getState() {
  const raw = await redis('GET', KEY);
  return raw ? JSON.parse(raw) : structuredClone(SEED);
}

// Optimistic concurrency: the write only lands if nobody saved since `expectedRev`.
export async function putState(next, expectedRev) {
  const cur = await getState();
  if (expectedRev != null && (cur.rev || 0) !== expectedRev) return { ok: false, state: cur };
  const saved = { ...next, rev: (cur.rev || 0) + 1 };
  await redis('SET', KEY, JSON.stringify(saved));
  return { ok: true, state: saved };
}

// Record one Done/Missed entry (email buttons). Retries if the dashboard saved in between.
export async function markEntry(date, id, entry) {
  for (let i = 0; i < 3; i++) {
    const s = await getState();
    s.log[date] = s.log[date] || {};
    s.log[date][id] = entry;
    const r = await putState(s, s.rev || 0);
    if (r.ok) return r.state;
  }
  throw new Error('Could not save after 3 tries. Tap the button again.');
}

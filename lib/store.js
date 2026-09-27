import { redis } from './redis.js';

const KEY = 'dbd:state';

export const SEED = {
  rev: 0,
  settings: { tz: 'America/New_York', checkpoints: { morning: '09:00', midday: '13:00', evening: '20:00' } },
  // Fresh installs start empty and land on onboarding.
  commitments: [],
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

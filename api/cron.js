import { isCron, isOwner } from '../lib/auth.js';
import { getState } from '../lib/store.js';
import { redis } from '../lib/redis.js';
import { sendCheckpoint } from '../lib/email.js';
import { SLOTS, localNow, toMins } from '../lib/time.js';

const WINDOW = 180; // a checkpoint email can still go out up to 3 hours late (scheduler delays)

// Called every 30 minutes by the scheduler. Sends each checkpoint's email once per day.
// Signed-in owner can force a test send: POST /api/cron?force=morning
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const owner = isOwner(req);
  if (!isCron(req) && !owner) return res.status(401).json({ error: 'Unauthorized.' });
  try {
    const state = await getState();
    const now = localNow(state.settings.tz);
    const force = owner && SLOTS.includes(req.query.force) ? req.query.force : null;
    const results = [];

    for (const slot of SLOTS) {
      if (force && slot !== force) continue;
      if (!force) {
        const due = toMins(state.settings.checkpoints[slot]);
        if (now.mins < due || now.mins > due + WINDOW) continue;
        // Atomic once-per-day guard
        const claimed = await redis('SET', `dbd:sent:${now.key}:${slot}`, '1', 'NX', 'EX', '172800');
        if (claimed !== 'OK') continue;
      }
      results.push({ slot, ...(await sendCheckpoint(state, slot, now, { force: !!force })) });
    }
    return res.json({ now, results });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

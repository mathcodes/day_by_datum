import { isOwner, isReader } from '../lib/auth.js';
import { getState, putState } from '../lib/store.js';
import { localNow } from '../lib/time.js';

// GET: the full record (you, or Claude with ?token=READ_TOKEN)
// PUT: {state, rev} from the dashboard; 409 if something else saved first
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      if (!isOwner(req) && !isReader(req)) return res.status(401).json({ error: 'Sign in first.' });
      const state = await getState();
      // View-only readers never get linked-calendar addresses: they work like passwords.
      const safe = isOwner(req) ? state : { ...state, feeds: (state.feeds || []).map(({ url, skip, ...f }) => f) };
      const body = { now: localNow(state.settings.tz), state: safe };
      // The owner's dashboard gets the read-only token so it can build a view-only link.
      if (isOwner(req) && process.env.READ_TOKEN) body.readToken = process.env.READ_TOKEN;
      return res.json(body);
    }
    if (req.method === 'PUT') {
      if (!isOwner(req)) return res.status(401).json({ error: 'Sign in first.' });
      const { state, rev } = req.body || {};
      if (!state || !Array.isArray(state.commitments) || !state.settings || typeof state.log !== 'object') {
        return res.status(400).json({ error: 'Malformed state.' });
      }
      const r = await putState(state, Number(rev) || 0);
      if (!r.ok) return res.status(409).json({ error: 'Changed elsewhere. Reloaded the latest.', state: r.state });
      return res.json({ state: r.state });
    }
    return res.status(405).json({ error: 'Use GET or PUT.' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

import { verify } from '../lib/sign.js';
import { getState, markEntry } from '../lib/store.js';
import { page, esc } from '../lib/page.js';
import { localNow, fmtDate } from '../lib/time.js';

// Email buttons land here.
// GET only shows a confirm screen. Mail scanners prefetch links, so a GET never writes.
// POST (your tap) records the entry. Missed requires a reason.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const t = req.method === 'POST' ? req.body?.t : req.query.t;
  const tok = verify(t);
  if (!tok) {
    return res.status(400).send(page('Link expired', `<h1>This link has expired</h1>
      <p class="muted">Email buttons work for 3 days. Mark it in the dashboard instead.</p><a class="btn plain" href="/">Open the dashboard</a>`));
  }
  try {
    const state = await getState();
    const c = state.commitments.find((x) => x.id === tok.i);
    const title = c ? c.title : 'That commitment was deleted';
    const existing = (state.log[tok.d] || {})[tok.i];
    const missed = tok.s === 'missed';

    if (req.method === 'POST') {
      const why = String(req.body?.why || '').trim();
      if (missed && !why) return res.status(400).send(form(t, title, tok, existing, 'Give a reason. That is the deal.'));
      const now = localNow(state.settings.tz);
      await markEntry(tok.d, tok.i, missed ? { s: 'missed', why, at: now.hhmm, via: 'email' } : { s: 'done', at: now.hhmm, via: 'email' });
      return res.send(page('Logged', `<h1>${missed ? 'Miss logged' : 'Logged as done'}</h1>
        <p><b>${esc(title)}</b><br><span class="muted">${fmtDate(tok.d)}</span></p>
        ${missed ? `<div class="card">${esc(why)}</div>` : ''}
        <a class="btn plain" href="/">Open the dashboard</a>`));
    }
    return res.send(form(t, title, tok, existing, ''));
  } catch (e) {
    return res.status(500).send(page('Error', `<h1>Couldn't save</h1><p class="err">${esc(e.message)}</p>`));
  }
}

function form(t, title, tok, existing, err) {
  const missed = tok.s === 'missed';
  const already = existing ? `<p class="muted">Already marked ${existing.s} at ${esc(existing.at || '')}. Submitting replaces it.</p>` : '';
  return page(missed ? 'Log a miss' : 'Confirm done', `<h1>${missed ? 'Log a miss' : 'Confirm done'}</h1>
    <p><b>${esc(title)}</b><br><span class="muted">${fmtDate(tok.d)}</span></p>${already}
    <form method="post" action="/api/mark">
      <input type="hidden" name="t" value="${esc(t)}">
      ${missed ? `<label for="why">Why did you miss it?</label><textarea id="why" name="why" required placeholder="Be specific."></textarea>` : ''}
      ${err ? `<p class="err">${esc(err)}</p>` : ''}
      <button class="${missed ? 'miss' : 'done'}" type="submit">${missed ? 'Log miss' : 'Confirm done'}</button>
    </form>`);
}

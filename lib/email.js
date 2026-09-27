import { sign } from './sign.js';
import { esc } from './page.js';
import { SLOTS, SLOT_NAME, TIER, fmt12, occurs, addDays, fmtDate, units } from './time.js';

export const baseUrl = () =>
  (process.env.APP_URL || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || 'localhost:3000'}`).replace(/\/$/, '');

const LINK_TTL = 3 * 24 * 60 * 60 * 1000; // buttons work for 3 days

function btn(label, url, color) {
  return `<a href="${url}" style="display:inline-block;padding:10px 16px;margin:4px 6px 0 0;border-radius:8px;background:${color};color:#fff;font-weight:700;text-decoration:none;font-family:Arial,sans-serif;font-size:14px">${label}</a>`;
}

function unitRow(u, date, late) {
  const url = (st) => `${baseUrl()}/api/mark?t=${sign({ d: date, i: u.key, s: st, exp: Date.now() + LINK_TTL })}`;
  const pad = u.sub ? 'padding:10px 0 10px 18px' : 'padding:14px 0;border-top:1px solid #D6DBE4';
  const evMeta = u.c.kind === 'event' ? [u.c.time ? fmt12(u.c.time) : '', u.c.where, u.c.who ? `with ${u.c.who}` : ''].filter(Boolean).map(esc).join(', ') : '';
  const meta = u.sub ? '' : `<div style="font-size:13px;color:#5B6479">${u.c.kind === 'event' ? `Event, ${evMeta}` : TIER[u.c.tier]}${u.c.amount ? `, ${esc(u.c.amount)}` : ''}</div>`;
  return `<tr><td style="${pad};font-family:Arial,sans-serif">
    <div style="font-size:${u.sub ? 15 : 16}px;font-weight:${u.sub ? 400 : 700};color:#16203A">${esc(u.title)}${late ? ' <span style="color:#B8322A;font-size:13px;font-weight:700">Overdue</span>' : ''}</div>
    ${meta}
    <div>${btn('Done', url('done'), '#2E7D5B')}${btn('Missed', url('missed'), '#B8322A')}${btn('Bypass', url('bypassed'), '#5B6479')}</div>
  </td></tr>`;
}
function groupRows(list, date, late) {
  // list: commitments, each with its open units
  return list.map(({ c, open }) => {
    if (!open[0].sub) return unitRow(open[0], date, late);
    const head = `<tr><td style="padding:14px 0 0;border-top:1px solid #D6DBE4;font-family:Arial,sans-serif">
      <div style="font-size:16px;font-weight:700;color:#16203A">${esc(c.title)}${late ? ' <span style="color:#B8322A;font-size:13px">Overdue</span>' : ''}</div>
      <div style="font-size:13px;color:#5B6479">${TIER[c.tier]}</div></td></tr>`;
    return head + open.map((u) => unitRow(u, date, false)).join('');
  }).join('');
}

// Build and send the email for one checkpoint. Returns a summary; skips when nothing is open.
export async function sendCheckpoint(state, slot, now, { force = false } = {}) {
  const { key } = now;
  const cps = state.settings.checkpoints;
  const log = state.log[key] || {};
  const todays = state.commitments
    .filter((c) => occurs(c, key))
    .map((c) => ({ c, open: units(c).filter((u) => !log[u.key]) }))
    .filter((x) => x.open.length);
  const idx = SLOTS.indexOf(slot);
  const current = todays.filter((x) => x.c.slot === slot);
  const overdue = todays.filter((x) => SLOTS.indexOf(x.c.slot) < idx);
  const count = (xs) => xs.reduce((n, x) => n + x.open.length, 0);

  const upcoming = [];
  if (slot === 'morning' || force) {
    for (const c of state.commitments.filter((x) => (x.freq === 'monthly' && x.day) || (x.freq === 'once' && x.date))) {
      for (let i = 1; i <= 3; i++) {
        const k = addDays(key, i);
        if (occurs(c, k)) { upcoming.push(`${esc(c.title)}${c.amount ? ` (${esc(c.amount)})` : ''} is due ${fmtDate(k)}.`); break; }
      }
    }
  }
  const noDay = state.commitments.filter((c) => (c.freq === 'monthly' && !c.day) || (c.freq === 'once' && !c.date));

  if (!current.length && !overdue.length && !force) return { skipped: 'nothing open' };

  const name = SLOT_NAME[slot];
  const bits = [`${count(current)} open`];
  if (overdue.length) bits.push(`${count(overdue)} overdue`);
  const subject = `${name} checkpoint: ${bits.join(', ')}`;

  const section = (title, list, late) => list.length
    ? `<h2 style="font-family:Arial,sans-serif;font-size:18px;color:#16203A;margin:24px 0 4px">${title}</h2><table width="100%" cellpadding="0" cellspacing="0">${groupRows(list, key, late)}</table>`
    : '';

  const notes = [
    ...upcoming,
    ...(noDay.length ? [`No due date set for ${noDay.map((c) => esc(c.title)).join(', ')}. Set one in the dashboard.`] : []),
  ];

  const html = `<!doctype html><html><body style="margin:0;background:#EDF0F4">
  <div style="max-width:560px;margin:0 auto;padding:24px;background:#fff;font-family:Arial,sans-serif;color:#16203A">
    <div style="font-size:13px;color:#5B6479">${fmtDate(key)}</div>
    <div style="font-size:30px;font-weight:700;margin:4px 0 2px">${name} checkpoint, ${fmt12(cps[slot])}</div>
    <div style="font-size:15px;color:#5B6479">Tap Done, Missed or Bypass. Missed and Bypass ask for a reason.</div>
    ${notes.length ? `<div style="margin-top:16px;padding:12px 14px;background:#FFF4D6;border-left:4px solid #F2A900;font-size:14px">${notes.join('<br>')}</div>` : ''}
    ${section(`Due by ${fmt12(cps[slot])}`, current, false)}
    ${section('Still open from earlier today', overdue, true)}
    ${!current.length && !overdue.length ? '<p style="margin-top:20px">Nothing open. This is a test send.</p>' : ''}
    <p style="margin-top:28px;font-size:14px"><a href="${baseUrl()}" style="color:#16203A;font-weight:700">Open the dashboard</a></p>
  </div></body></html>`;

  const text = [
    `${name} checkpoint, ${fmt12(cps[slot])}`,
    ...current.flatMap((x) => x.open.map((u) => `- ${u.sub ? `${x.c.title}: ` : ''}${u.title}`)),
    ...(overdue.length ? ['Still open from earlier:', ...overdue.flatMap((x) => x.open.map((u) => `- ${u.sub ? `${x.c.title}: ` : ''}${u.title}`))] : []),
    `Check in: ${baseUrl()}`,
  ].join('\n');

  if (!process.env.RESEND_API_KEY || !process.env.TO_EMAIL) throw new Error('RESEND_API_KEY and TO_EMAIL must be set.');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || 'Day by Datum <onboarding@resend.dev>',
      to: [process.env.TO_EMAIL], subject, html, text,
    }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
  return { sent: subject, items: count(current) + count(overdue) };
}

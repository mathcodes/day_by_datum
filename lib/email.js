import { sign } from './sign.js';
import { esc } from './page.js';
import { SLOTS, SLOT_NAME, TIER, toMins, fmt12, occurs, addDays, fmtDate } from './time.js';

export const baseUrl = () =>
  (process.env.APP_URL || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || 'localhost:3000'}`).replace(/\/$/, '');

const LINK_TTL = 3 * 24 * 60 * 60 * 1000; // buttons work for 3 days

function btn(label, url, color) {
  return `<a href="${url}" style="display:inline-block;padding:10px 16px;margin:4px 6px 0 0;border-radius:8px;background:${color};color:#fff;font-weight:700;text-decoration:none;font-family:Arial,sans-serif;font-size:14px">${label}</a>`;
}

function itemRow(c, date, late) {
  const u = (s) => `${baseUrl()}/api/mark?t=${sign({ d: date, i: c.id, s, exp: Date.now() + LINK_TTL })}`;
  return `<tr><td style="padding:14px 0;border-top:1px solid #D6DBE4;font-family:Arial,sans-serif">
    <div style="font-size:16px;font-weight:700;color:#16203A">${esc(c.title)}${late ? ' <span style="color:#B8322A;font-size:13px">Overdue</span>' : ''}</div>
    <div style="font-size:13px;color:#5B6479">${TIER[c.tier]}${c.amount ? `, ${esc(c.amount)}` : ''}</div>
    <div>${btn('Done', u('done'), '#2E7D5B')}${btn('Missed', u('missed'), '#B8322A')}</div>
  </td></tr>`;
}

// Build and send the email for one checkpoint. Returns a summary; skips when nothing is open.
export async function sendCheckpoint(state, slot, now, { force = false } = {}) {
  const { key } = now;
  const cps = state.settings.checkpoints;
  const open = (c) => !(state.log[key] || {})[c.id];
  const todays = state.commitments.filter((c) => occurs(c, key) && open(c));
  const idx = SLOTS.indexOf(slot);
  const current = todays.filter((c) => c.slot === slot);
  const overdue = todays.filter((c) => SLOTS.indexOf(c.slot) < idx);

  const upcoming = [];
  if (slot === 'morning' || force) {
    for (const c of state.commitments.filter((x) => x.freq === 'monthly' && x.day)) {
      for (let i = 1; i <= 3; i++) {
        const k = addDays(key, i);
        if (occurs(c, k)) { upcoming.push(`${esc(c.title)}${c.amount ? ` (${esc(c.amount)})` : ''} is due ${fmtDate(k)}.`); break; }
      }
    }
  }
  const noDay = state.commitments.filter((c) => c.freq === 'monthly' && !c.day);

  if (!current.length && !overdue.length && !force) return { skipped: 'nothing open' };

  const name = SLOT_NAME[slot];
  const bits = [`${current.length} open`];
  if (overdue.length) bits.push(`${overdue.length} overdue`);
  const subject = `${name} checkpoint: ${bits.join(', ')}`;

  const section = (title, list, late) => list.length
    ? `<h2 style="font-family:Arial,sans-serif;font-size:18px;color:#16203A;margin:24px 0 4px">${title}</h2><table width="100%" cellpadding="0" cellspacing="0">${list.map((c) => itemRow(c, key, late)).join('')}</table>`
    : '';

  const notes = [
    ...upcoming,
    ...(noDay.length ? [`No due day set for ${noDay.map((c) => esc(c.title)).join(', ')}. Set one in the dashboard.`] : []),
  ];

  const html = `<!doctype html><html><body style="margin:0;background:#EDF0F4">
  <div style="max-width:560px;margin:0 auto;padding:24px;background:#fff;font-family:Arial,sans-serif;color:#16203A">
    <div style="font-size:13px;color:#5B6479">${fmtDate(key)}</div>
    <div style="font-size:30px;font-weight:700;margin:4px 0 2px">${name} checkpoint, ${fmt12(cps[slot])}</div>
    <div style="font-size:15px;color:#5B6479">Tap Done or Missed. Missed asks for a reason.</div>
    ${notes.length ? `<div style="margin-top:16px;padding:12px 14px;background:#FFF4D6;border-left:4px solid #F2A900;font-size:14px">${notes.join('<br>')}</div>` : ''}
    ${section(`Due by ${fmt12(cps[slot])}`, current, false)}
    ${section('Still open from earlier today', overdue, true)}
    ${!current.length && !overdue.length ? '<p style="margin-top:20px">Nothing open. This is a test send.</p>' : ''}
    <p style="margin-top:28px;font-size:14px"><a href="${baseUrl()}" style="color:#16203A;font-weight:700">Open the dashboard</a></p>
  </div></body></html>`;

  const text = [
    `${name} checkpoint, ${fmt12(cps[slot])}`,
    ...current.map((c) => `- ${c.title}`),
    ...(overdue.length ? ['Still open from earlier:', ...overdue.map((c) => `- ${c.title}`)] : []),
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
  return { sent: subject, items: current.length + overdue.length };
}

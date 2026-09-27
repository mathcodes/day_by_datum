// Manually runs the checkpoint-email check, the same call GitHub makes every 30 minutes.
// It only sends an email if a checkpoint is due and hasn't been sent today.
//   npm run cron:local  -> http://localhost:3000   (reads .env.local)
//   npm run cron:prod   -> production              (reads .env.production.local, from `npm run env:prod`)
import { readFileSync, existsSync } from 'node:fs';

const base = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const file = base.includes('localhost') ? '.env.local' : '.env.production.local';
let secret = process.env.CRON_SECRET;
if (!secret && existsSync(file)) {
  const line = readFileSync(file, 'utf8').split('\n').find((l) => l.startsWith('CRON_SECRET='));
  secret = line && line.slice('CRON_SECRET='.length).trim().replace(/^"|"$/g, '');
}
if (!secret) { console.error(`No CRON_SECRET found. Run the matching env:pull script first (${file}).`); process.exit(1); }

const res = await fetch(`${base}/api/cron`, { method: 'POST', headers: { Authorization: `Bearer ${secret}` } });
const text = await res.text();
console.log(`${res.status} ${res.statusText}`);
try { console.log(JSON.stringify(JSON.parse(text), null, 2)); } catch { console.log(text.slice(0, 800)); }
process.exit(res.ok ? 0 : 1);

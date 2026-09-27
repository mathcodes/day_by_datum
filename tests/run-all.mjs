// Runs every *.test.mjs in this folder and fails if any check fails.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('.', import.meta.url));
const only = process.argv[2];
const files = readdirSync(dir).filter((f) => f.endsWith('.test.mjs') && (!only || f.includes(only))).sort();
let failed = 0, total = 0, broken = 0;

for (const f of files) {
  const r = spawnSync(process.execPath, [dir + f], { encoding: 'utf8', timeout: 180000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const m = /(\d+) failed of (\d+)/.exec(out);
  if (!m) { broken++; console.log(`\u2717 ${f}: did not finish\n${out.slice(-1500)}`); continue; }
  failed += +m[1]; total += +m[2];
  console.log(`${+m[1] ? '\u2717' : '\u2713'} ${f.padEnd(24)} ${m[2] - m[1]}/${m[2]} passed`);
  if (+m[1]) out.split('\n').filter((l) => l.startsWith('FAIL')).forEach((l) => console.log('    ' + l));
}
console.log(`\n${total - failed}/${total} checks passed across ${files.length} suites` + (broken ? `, ${broken} suite(s) crashed` : ''));
process.exit(failed || broken ? 1 : 0);

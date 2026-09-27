// Syntax-checks every server file and the dashboard's inline script, without running anything.
import { readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('..', import.meta.url));
let bad = 0;
for (const d of ['api', 'lib', 'scripts']) {
  for (const f of readdirSync(root + d).filter((x) => /\.m?js$/.test(x))) {
    const r = spawnSync(process.execPath, ['--check', `${root}${d}/${f}`], { encoding: 'utf8' });
    if (r.status) { bad++; console.log(`\u2717 ${d}/${f}\n${r.stderr}`); } else console.log(`\u2713 ${d}/${f}`);
  }
}
const html = readFileSync(root + 'public/index.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
scripts.forEach((code, i) => {
  try { new vm.Script(code, { filename: `public/index.html <script #${i + 1}>` }); console.log(`\u2713 public/index.html inline script #${i + 1}`); }
  catch (e) { bad++; console.log(`\u2717 public/index.html inline script #${i + 1}: ${e.message}`); }
});
process.exit(bad ? 1 : 0);

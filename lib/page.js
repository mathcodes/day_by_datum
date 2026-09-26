// Tiny server-rendered page shell for the email-button confirm screens.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function page(title, body) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Barlow+Condensed:wght@600;700&display=swap">
<style>
:root{--bg:#EDF0F4;--card:#fff;--ink:#16203A;--muted:#5B6479;--line:#D6DBE4;--amber:#F2A900;--done:#2E7D5B;--miss:#B8322A;color-scheme:light;
padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
@media (prefers-color-scheme:dark){:root{--bg:#0F1524;--card:#18213A;--ink:#E8ECF4;--muted:#9AA3B8;--line:#2A3553;--amber:#F2B632;--done:#4CB387;--miss:#E8665C;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.5 'Atkinson Hyperlegible',system-ui,sans-serif}
main{max-width:480px;margin:0 auto;padding:40px 20px}
h1{font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-size:2.6rem;line-height:1;margin:0 0 8px}
.muted{color:var(--muted)}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px;margin:20px 0}
label{display:block;font-weight:700;margin-bottom:6px}
textarea{width:100%;min-height:110px;font:inherit;padding:12px;border-radius:8px;border:1.5px solid var(--line);background:var(--card);color:var(--ink)}
button,.btn{display:block;width:100%;text-align:center;font:inherit;font-weight:700;padding:14px;border-radius:10px;border:0;margin-top:14px;cursor:pointer;text-decoration:none}
.done{background:var(--done);color:#fff}.miss{background:var(--miss);color:#fff}.plain{background:transparent;color:var(--ink);border:1.5px solid var(--line)}
.err{color:var(--miss);font-weight:700}
:focus-visible{outline:3px solid var(--amber);outline-offset:2px}
</style></head><body><main>${body}</main></body></html>`;
}

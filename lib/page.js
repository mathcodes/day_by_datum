// Tiny server-rendered page shell for the email-button confirm screens.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function page(title, body) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap">
<style>
:root{--bg:#0D131A;--card:#141C25;--card-2:#19232E;--line:#232F3D;--line-2:#2F3E50;--ink:#E6EDF3;--muted:#8C9AA9;--accent:#3ECFB2;--accent-ink:#052620;--done:#3ECFB2;--miss:#F07070;color-scheme:dark;
padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
*{box-sizing:border-box}html,body{overflow-x:clip}body{margin:0;background:var(--bg);color:var(--ink);font:400 14px/1.5 'Manrope',system-ui,sans-serif}
main{max-width:420px;margin:0 auto;padding:40px 18px}
h1{font-size:20px;font-weight:700;margin:0 0 8px;letter-spacing:-.01em}
.muted{color:var(--muted)}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px;margin:16px 0}
label{display:block;font-weight:600;font-size:12px;color:var(--muted);margin-bottom:6px}
textarea{width:100%;min-height:100px;font:inherit;font-size:14px;padding:10px;border-radius:7px;border:1px solid var(--line-2);background:var(--bg);color:var(--ink)}
textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(62,207,178,.15)}
button,.btn{display:block;width:100%;text-align:center;font:inherit;font-size:14px;font-weight:600;height:42px;line-height:42px;padding:0;border-radius:8px;border:0;margin-top:12px;cursor:pointer;text-decoration:none}
.done{background:var(--done);color:var(--accent-ink)}.miss{background:var(--miss);color:#2A0B0B}.plain{background:var(--card-2);color:var(--ink);border:1px solid var(--line-2)}
.err{color:var(--miss);font-weight:600}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
</style></head><body><main>${body}</main></body></html>`;
}

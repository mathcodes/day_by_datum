// Minimal Upstash Redis REST client. No dependencies.
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export async function redis(...cmd) {
  if (!URL_ || !TOKEN) {
    throw new Error('Redis is not configured. Add the Upstash Redis integration to this Vercel project.');
  }
  let r;
  try {
    r = await fetch(URL_, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd),
    });
  } catch (e) {
    // Node reports network failures as a bare "fetch failed"; the useful part is in e.cause.
    const c = e.cause || {};
    let host = '';
    try { host = new URL(URL_).host; } catch { host = '(invalid URL)'; }
    console.error('Redis fetch failed', { host, code: c.code, message: c.message });
    throw new Error(`Can't reach the database at ${host}${c.code ? ` (${c.code})` : ''}.`);
  }
  const j = await r.json();
  if (j.error) throw new Error(`Redis: ${j.error}`);
  return j.result;
}

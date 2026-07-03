// POST /api/subscribe — captura de emails (newsletter y waitlist Pro) en Vercel Blob.
// Contrato: {email, list: 'newsletter'|'pro-waitlist', website: ''(honeypot)} → {ok}
const { put } = require('@vercel/blob');

const LISTS = new Set(['newsletter', 'pro-waitlist']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method' });
    return;
  }
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};
  const email = String(body.email || '').trim().toLowerCase();
  const list = String(body.list || '');
  const honeypot = String(body.website || '');
  if (honeypot) { res.status(200).json({ ok: true }); return; }
  if (!EMAIL_RE.test(email) || email.length > 254 || !LISTS.has(list)) {
    res.status(400).json({ ok: false, error: 'invalid' });
    return;
  }
  try {
    const ts = new Date().toISOString();
    const key = ts.replace(/[:.]/g, '-') + '-' + Math.random().toString(36).slice(2, 10);
    await put(
      `signups/${list}/${key}.json`,
      JSON.stringify({ email, list, ts, ua: req.headers['user-agent'] || '' }),
      { access: 'public', contentType: 'application/json', addRandomSuffix: false }
    );
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('subscribe error:', err && err.message);
    res.status(503).json({ ok: false, error: 'storage' });
  }
};

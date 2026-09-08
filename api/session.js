import crypto from 'node:crypto';

const COOKIE = 'studio_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function signature() {
  const secret = process.env.STUDIO_ACCESS_TOKEN || '';
  if (!secret) return '';
  return crypto.createHmac('sha256', secret).update('chongyu-studio-founder-session-v1').digest('hex');
}

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  return Object.fromEntries(raw.split(';').map(part => {
    const idx = part.indexOf('=');
    if (idx < 0) return ['', ''];
    return [part.slice(0, idx).trim(), decodeURIComponent(part.slice(idx + 1).trim())];
  }).filter(([k]) => k));
}

function setCookie(res, value, maxAge = MAX_AGE) {
  res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`);
}

export default async function handler(req, res) {
  const expected = process.env.STUDIO_ACCESS_TOKEN || '';
  if (!expected) return res.status(503).json({ ok: false, error: 'Studio access token is not configured.' });

  if (req.method === 'GET') {
    const cookie = parseCookies(req)[COOKIE] || '';
    const sig = signature();
    return res.status(200).json({ authenticated: Boolean(cookie && sig && safeEqual(cookie, sig)) });
  }

  if (req.method === 'POST') {
    const supplied = String(req.body?.token || '');
    if (!supplied || !safeEqual(supplied, expected)) {
      return res.status(401).json({ ok: false, error: 'Invalid Studio access token.' });
    }
    setCookie(res, signature());
    return res.status(200).json({ ok: true, authenticated: true });
  }

  if (req.method === 'DELETE') {
    setCookie(res, '', 0);
    return res.status(200).json({ ok: true, authenticated: false });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}

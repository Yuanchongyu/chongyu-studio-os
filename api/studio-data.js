import crypto from 'node:crypto';

const PROJECT_URL = 'https://lclkojyfyqhefwmkmgym.supabase.co';
const SESSION_COOKIE = 'studio_session';

function serverKey() {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

function headers(extra = {}) {
  const key = serverKey();
  const h = { apikey: key, 'Content-Type': 'application/json', ...extra };
  if (key.startsWith('eyJ')) h.Authorization = `Bearer ${key}`;
  return h;
}

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  return Object.fromEntries(raw.split(';').map(part => {
    const idx = part.indexOf('=');
    if (idx < 0) return ['', ''];
    return [part.slice(0, idx).trim(), decodeURIComponent(part.slice(idx + 1).trim())];
  }).filter(([k]) => k));
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function sessionSignature() {
  const secret = process.env.STUDIO_ACCESS_TOKEN || '';
  if (!secret) return '';
  return crypto.createHmac('sha256', secret).update('chongyu-studio-founder-session-v1').digest('hex');
}

function authorized(req) {
  const expected = process.env.STUDIO_ACCESS_TOKEN || '';
  if (!expected) return false;

  // Keep header auth for scripts / future MCP wrappers.
  const supplied = req.headers['x-studio-access-token'] || '';
  if (supplied && safeEqual(supplied, expected)) return true;

  // Browser uses an HttpOnly derived session cookie so the real access token is
  // never stored in localStorage/sessionStorage or exposed to frontend JS.
  const cookie = parseCookies(req)[SESSION_COOKIE] || '';
  const signature = sessionSignature();
  return Boolean(cookie && signature && safeEqual(cookie, signature));
}

async function rest(table, query = '') {
  const key = serverKey();
  if (!key) throw new Error('Supabase server key is not configured in Vercel.');
  const url = `${PROJECT_URL}/rest/v1/${table}${query ? `?${query}` : ''}`;
  const r = await fetch(url, { headers: headers() });
  const text = await r.text();
  if (!r.ok) throw new Error(`${table}: ${r.status} ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : [];
}

async function insert(table, body) {
  const key = serverKey();
  if (!key) throw new Error('Supabase server key is not configured in Vercel.');
  const r = await fetch(`${PROJECT_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(body)
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${table}: ${r.status} ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : [];
}

async function patch(table, query, body) {
  const key = serverKey();
  if (!key) throw new Error('Supabase server key is not configured in Vercel.');
  const r = await fetch(`${PROJECT_URL}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(body)
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${table}: ${r.status} ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : [];
}

async function bootstrap() {
  const specs = [
    ['students', 'select=id,slug,name,age,current_level,current_project,status,progress,parent_notes&order=name.asc'],
    ['lessons', 'select=id,student_id,lesson_number,lesson_date,title,plan,summary,achievement,difficulty,next_step,created_at&order=lesson_date.asc'],
    ['student_skills', 'select=student_id,skill_name,score,confidence,evidence,updated_at'],
    ['content_items', 'select=id,title,platform,pillar,hook,body,status,source_type,source_label,published_at,created_at,updated_at&order=updated_at.desc'],
    ['content_metrics', 'select=content_id,captured_at,views,likes,comments,saves,followers_gained,leads&order=captured_at.desc'],
    ['company_brain', 'select=id,brain_type,title,body,evidence,status,created_by,approved_by,created_at,updated_at&order=updated_at.desc'],
    ['decisions', 'select=id,topic,context,decision,rationale,status,proposed_by,approved_by,created_at,approved_at&order=created_at.desc'],
    ['inbox_items', 'select=id,input_type,raw_content,classification,status,created_at&order=created_at.desc&limit=50'],
    ['memory_items', 'select=id,memory_type,entity_type,entity_ref,title,summary,details,source_type,source_ref,importance,status,created_by,approved_by,created_at,updated_at&status=neq.archived&order=importance.desc,updated_at.desc&limit=100']
  ];

  const entries = await Promise.all(specs.map(async ([name, q]) => [name, await rest(name, q)]));
  return Object.fromEntries(entries);
}

const text = (value, max = 50000) => String(value ?? '').trim().slice(0, max);
const num = (value, min, max, fallback = null) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

async function studentIdFromPayload(payload) {
  if (payload?.student_id) return String(payload.student_id);
  const slug = text(payload?.student_slug, 120);
  if (!slug) return null;
  const rows = await rest('students', `select=id&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  return rows[0]?.id || null;
}

async function handleAction(action, payload = {}) {
  if (action === 'capture') {
    const content = text(payload.content);
    if (!content) throw new Error('Capture content is required.');
    const rows = await insert('inbox_items', {
      input_type: text(payload.input_type || 'founder_note', 80),
      raw_content: content,
      classification: payload.classification && typeof payload.classification === 'object' ? payload.classification : {},
      status: 'new'
    });
    return { ok: true, item: rows[0] || null };
  }

  if (action === 'create_student') {
    const name = text(payload.name, 200);
    const slug = text(payload.slug, 120).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
    if (!name || !slug) throw new Error('Student name and slug are required.');
    const rows = await insert('students', {
      slug,
      name,
      age: num(payload.age, 1, 120, null),
      current_level: text(payload.current_level, 300) || null,
      current_project: text(payload.current_project, 500) || null,
      status: ['active','paused','completed'].includes(payload.status) ? payload.status : 'active',
      progress: num(payload.progress, 0, 100, 0),
      parent_notes: text(payload.parent_notes) || null
    });
    return { ok: true, student: rows[0] || null };
  }

  if (action === 'create_lesson') {
    const studentId = await studentIdFromPayload(payload);
    const title = text(payload.title, 500);
    if (!studentId || !title) throw new Error('A valid student and lesson title are required.');
    const rows = await insert('lessons', {
      student_id: studentId,
      lesson_number: num(payload.lesson_number, 0, 10000, null),
      lesson_date: payload.lesson_date || new Date().toISOString().slice(0, 10),
      title,
      plan: text(payload.plan) || null,
      raw_notes: text(payload.raw_notes) || null,
      summary: text(payload.summary) || null,
      achievement: text(payload.achievement) || null,
      difficulty: text(payload.difficulty) || null,
      next_step: text(payload.next_step) || null,
      ai_generated: Boolean(payload.ai_generated)
    });
    return { ok: true, lesson: rows[0] || null };
  }

  if (action === 'save_memory') {
    const title = text(payload.title, 500);
    const summary = text(payload.summary);
    if (!title || !summary) throw new Error('Memory title and summary are required.');
    const rows = await insert('memory_items', {
      memory_type: text(payload.memory_type || 'insight', 120),
      entity_type: text(payload.entity_type || 'company', 120),
      entity_ref: text(payload.entity_ref, 300) || null,
      title,
      summary,
      details: payload.details && typeof payload.details === 'object' ? payload.details : {},
      source_type: text(payload.source_type || 'studio_web', 120),
      source_ref: text(payload.source_ref, 500) || null,
      importance: num(payload.importance, 1, 5, 3),
      status: ['candidate','active','archived'].includes(payload.status) ? payload.status : 'candidate',
      created_by: text(payload.created_by || 'Founder', 200),
      approved_by: text(payload.approved_by, 200) || null
    });
    return { ok: true, memory: rows[0] || null };
  }

  if (action === 'save_decision') {
    const topic = text(payload.topic, 500);
    const decision = text(payload.decision);
    if (!topic || !decision) throw new Error('Decision topic and decision are required.');
    const status = ['proposed','active','superseded','rejected'].includes(payload.status) ? payload.status : 'proposed';
    const rows = await insert('decisions', {
      topic,
      context: text(payload.context) || null,
      decision,
      rationale: text(payload.rationale) || null,
      status,
      proposed_by: text(payload.proposed_by || 'Founder', 200),
      approved_by: text(payload.approved_by, 200) || (status === 'active' ? 'Chongyu' : null),
      source_type: text(payload.source_type || 'studio_web', 120),
      source_id: payload.source_id || null,
      approved_at: status === 'active' ? new Date().toISOString() : null
    });
    return { ok: true, decision: rows[0] || null };
  }

  if (action === 'create_content') {
    const title = text(payload.title, 500);
    if (!title) throw new Error('Content title is required.');
    const rows = await insert('content_items', {
      title,
      platform: text(payload.platform || 'xiaohongshu', 120),
      pillar: text(payload.pillar, 300) || null,
      hook: text(payload.hook) || null,
      body: text(payload.body) || null,
      status: ['idea','draft','ready','published','archived'].includes(payload.status) ? payload.status : 'idea',
      source_type: text(payload.source_type || 'studio_web', 120),
      source_id: payload.source_id || null,
      source_label: text(payload.source_label, 500) || null,
      published_at: payload.published_at || null
    });
    return { ok: true, content: rows[0] || null };
  }

  if (action === 'update_inbox_status') {
    const id = text(payload.id, 100);
    const status = ['new','processed','archived'].includes(payload.status) ? payload.status : null;
    if (!id || !status) throw new Error('Inbox id and valid status are required.');
    const rows = await patch('inbox_items', `id=eq.${encodeURIComponent(id)}`, { status });
    return { ok: true, item: rows[0] || null };
  }

  throw new Error('Unknown action.');
}

export default async function handler(req, res) {
  if (!authorized(req)) return res.status(401).json({ error: 'Founder session is missing or invalid.' });

  try {
    if (req.method === 'GET') {
      const data = await bootstrap();
      return res.status(200).json({ source: 'supabase', project: 'chongyu-studio-os', data });
    }

    if (req.method === 'POST') {
      const { action, payload } = req.body || {};
      const result = await handleAction(action, payload || {});
      return res.status(200).json(result);
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    console.error('Studio data API error:', error);
    const status = /required|valid|unknown action/i.test(error.message || '') ? 400 : 500;
    return res.status(status).json({ error: error.message || 'Studio data request failed.' });
  }
}

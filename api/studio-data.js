const PROJECT_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lclkojyfyqhefwmkmgym.supabase.co';

function serverKey() {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

function headers(extra = {}) {
  const key = serverKey();
  const h = { apikey: key, 'Content-Type': 'application/json', ...extra };
  if (key.startsWith('eyJ')) h.Authorization = `Bearer ${key}`;
  return h;
}

function authorized(req) {
  const expected = process.env.STUDIO_ACCESS_TOKEN || '';
  const supplied = req.headers['x-studio-access-token'] || '';
  return Boolean(expected && supplied && supplied === expected);
}

async function rest(table, query = '') {
  const key = serverKey();
  if (!key) throw new Error('Supabase server key is not configured in Vercel.');
  const url = `${PROJECT_URL.replace(/\/$/, '')}/rest/v1/${table}${query ? `?${query}` : ''}`;
  const r = await fetch(url, { headers: headers() });
  const text = await r.text();
  if (!r.ok) throw new Error(`${table}: ${r.status} ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : [];
}

async function insert(table, body) {
  const key = serverKey();
  if (!key) throw new Error('Supabase server key is not configured in Vercel.');
  const r = await fetch(`${PROJECT_URL.replace(/\/$/, '')}/rest/v1/${table}`, {
    method: 'POST',
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

export default async function handler(req, res) {
  if (!authorized(req)) return res.status(401).json({ error: 'Studio access token is missing or invalid.' });

  try {
    if (req.method === 'GET') {
      const data = await bootstrap();
      return res.status(200).json({ source: 'supabase', project: 'chongyu-studio-os', data });
    }

    if (req.method === 'POST') {
      const { action, payload } = req.body || {};
      if (action === 'capture') {
        const content = String(payload?.content || '').trim();
        if (!content) return res.status(400).json({ error: 'Capture content is required.' });
        const rows = await insert('inbox_items', {
          input_type: String(payload?.input_type || 'note').slice(0, 80),
          raw_content: content.slice(0, 50000),
          classification: payload?.classification || {},
          status: 'new'
        });
        return res.status(200).json({ ok: true, item: rows[0] || null });
      }
      return res.status(400).json({ error: 'Unknown action.' });
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    console.error('Studio data API error:', error);
    return res.status(500).json({ error: error.message || 'Studio data request failed.' });
  }
}

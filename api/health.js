const STUDIO_SUPABASE_URL = 'https://lclkojyfyqhefwmkmgym.supabase.co';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });

  // Server-side Studio APIs must always target the canonical Studio project.
  // Do not rely on NEXT_PUBLIC_SUPABASE_URL here because that variable may be
  // managed by a separate Vercel/Supabase integration and can point elsewhere.
  const supabaseUrl = process.env.SUPABASE_URL || STUDIO_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const configured = {
    supabase: Boolean(supabaseKey),
    openai: Boolean(process.env.OPENAI_API_KEY),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    accessToken: Boolean(process.env.STUDIO_ACCESS_TOKEN)
  };

  let database = 'not_configured';
  let databaseDetail = null;
  if (configured.supabase) {
    try {
      const headers = { apikey: supabaseKey };
      // Legacy service_role keys are JWTs and need Authorization too.
      // New sb_secret_* keys should be sent only as apikey.
      if (supabaseKey.startsWith('eyJ')) headers.Authorization = `Bearer ${supabaseKey}`;
      const r = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/students?select=id&limit=1`, { headers });
      if (r.ok) {
        database = 'connected';
      } else {
        database = `error_${r.status}`;
        const body = await r.text();
        // Safe diagnostic: only return the upstream status/message, never keys.
        databaseDetail = body.slice(0, 300);
      }
    } catch (error) {
      database = 'unreachable';
      databaseDetail = error?.message || 'Unknown connection error';
    }
  }

  const memoryReady = configured.supabase && configured.accessToken && database === 'connected';
  res.status(200).json({
    status: memoryReady ? 'memory_ready' : 'setup_required',
    configured,
    database,
    databaseDetail,
    project: 'chongyu-studio-os',
    targetHost: new URL(supabaseUrl).host,
    note: memoryReady
      ? 'Studio memory is ready. OpenAI/Anthropic are optional for the current workflow.'
      : 'Studio memory backend is not ready yet; inspect database/databaseDetail.',
    timestamp: new Date().toISOString()
  });
}

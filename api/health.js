export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lclkojyfyqhefwmkmgym.supabase.co';
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const configured = {
    supabase: Boolean(supabaseKey),
    openai: Boolean(process.env.OPENAI_API_KEY),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    accessToken: Boolean(process.env.STUDIO_ACCESS_TOKEN)
  };

  let database = 'not_configured';
  if (configured.supabase) {
    try {
      const headers = { apikey: supabaseKey };
      if (supabaseKey.startsWith('eyJ')) headers.Authorization = `Bearer ${supabaseKey}`;
      const r = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/students?select=id&limit=1`, { headers });
      database = r.ok ? 'connected' : `error_${r.status}`;
    } catch (_) {
      database = 'unreachable';
    }
  }

  const memoryReady = configured.supabase && configured.accessToken && database === 'connected';
  res.status(200).json({
    status: memoryReady ? 'memory_ready' : 'setup_required',
    configured,
    database,
    project: 'chongyu-studio-os',
    note: memoryReady
      ? 'Studio memory is ready. OpenAI/Anthropic are optional for the current workflow.'
      : 'Configure the Supabase server key and Studio access token to enable live memory.',
    timestamp: new Date().toISOString()
  });
}

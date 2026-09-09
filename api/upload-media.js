import crypto from 'node:crypto';

const PROJECT_URL = 'https://lclkojyfyqhefwmkmgym.supabase.co';
const SESSION_COOKIE = 'studio_session';
const MAX_BYTES = 3_500_000;

function serverKey(){ return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''; }
function parseCookies(req){ const raw=req.headers.cookie||''; return Object.fromEntries(raw.split(';').map(part=>{const i=part.indexOf('=');return i<0?['','']:[part.slice(0,i).trim(),decodeURIComponent(part.slice(i+1).trim())]}).filter(([k])=>k)); }
function safeEqual(a,b){const aa=Buffer.from(String(a||''));const bb=Buffer.from(String(b||''));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);}
function sessionSignature(){const s=process.env.STUDIO_ACCESS_TOKEN||'';return s?crypto.createHmac('sha256',s).update('chongyu-studio-founder-session-v1').digest('hex'):'';}
function authorized(req){const expected=process.env.STUDIO_ACCESS_TOKEN||'';if(!expected)return false;const supplied=req.headers['x-studio-access-token']||'';if(supplied&&safeEqual(supplied,expected))return true;const cookie=parseCookies(req)[SESSION_COOKIE]||'';const sig=sessionSignature();return Boolean(cookie&&sig&&safeEqual(cookie,sig));}
function apiHeaders(extra={}){const k=serverKey();const h={apikey:k,...extra};if(k.startsWith('eyJ'))h.Authorization=`Bearer ${k}`;return h;}
function safeName(v){return String(v||'media').toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120)||'media';}
function encodeStoragePath(path){return path.split('/').map(encodeURIComponent).join('/');}

async function rest(table,q=''){const r=await fetch(`${PROJECT_URL}/rest/v1/${table}${q?`?${q}`:''}`,{headers:apiHeaders({'Content-Type':'application/json'})});const t=await r.text();if(!r.ok)throw new Error(`${table}: ${r.status} ${t.slice(0,400)}`);return t?JSON.parse(t):[];}
async function insert(table,body){const r=await fetch(`${PROJECT_URL}/rest/v1/${table}`,{method:'POST',headers:apiHeaders({'Content-Type':'application/json',Prefer:'return=representation'}),body:JSON.stringify(body)});const t=await r.text();if(!r.ok)throw new Error(`${table}: ${r.status} ${t.slice(0,400)}`);return t?JSON.parse(t):[];}
async function signObject(bucket,path,expiresIn=3600){const r=await fetch(`${PROJECT_URL}/storage/v1/object/sign/${encodeStoragePath(bucket)}/${encodeStoragePath(path)}`,{method:'POST',headers:apiHeaders({'Content-Type':'application/json'}),body:JSON.stringify({expiresIn})});const t=await r.text();if(!r.ok)throw new Error(`storage sign: ${r.status} ${t.slice(0,400)}`);const data=t?JSON.parse(t):{};const signed=data.signedURL||data.signedUrl||'';return signed?(signed.startsWith('http')?signed:`${PROJECT_URL}/storage/v1${signed}`):null;}

export default async function handler(req,res){
  if(!authorized(req)) return res.status(401).json({error:'Founder session is missing or invalid.'});
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed.'});
  try{
    const {student_slug,session_number,kind='lesson',file_name,mime_type,data_base64,title}=req.body||{};
    const slug=String(student_slug||'').trim().toLowerCase().replace(/[^a-z0-9_-]+/g,'-');
    if(!slug) return res.status(400).json({error:'student_slug is required.'});
    if(!String(mime_type||'').startsWith('image/')) return res.status(400).json({error:'This uploader currently accepts images only.'});
    const raw=String(data_base64||'').replace(/^data:[^;]+;base64,/, '');
    if(!raw) return res.status(400).json({error:'Image data is required.'});
    const buffer=Buffer.from(raw,'base64');
    if(!buffer.length||buffer.length>MAX_BYTES) return res.status(413).json({error:'Image is too large after compression. Keep it under 3.5 MB.'});

    const students=await rest('students',`select=id,slug,name&slug=eq.${encodeURIComponent(slug)}&limit=1`);
    const student=students[0];
    if(!student) return res.status(404).json({error:'Student not found.'});

    const isPortrait=kind==='portrait';
    const bucket=isPortrait?'student-artifacts':'lesson-media';
    const ext=String(mime_type).includes('png')?'png':String(mime_type).includes('webp')?'webp':'jpg';
    const base=isPortrait?'portrait':`session-${String(Number(session_number)||0).padStart(2,'0')}-${safeName(String(file_name||'lesson-image').replace(/\.[^.]+$/,''))}`;
    const path=`${slug}/${base}.${ext}`;
    const upload=await fetch(`${PROJECT_URL}/storage/v1/object/${encodeStoragePath(bucket)}/${encodeStoragePath(path)}`,{
      method:'POST',
      headers:apiHeaders({'Content-Type':mime_type,'x-upsert':'true'}),
      body:buffer
    });
    const uploadText=await upload.text();
    if(!upload.ok) throw new Error(`storage upload: ${upload.status} ${uploadText.slice(0,500)}`);

    const artifactTitle=String(title||'').trim() || (isPortrait?`${student.name} profile portrait`:`${student.name} · Session ${session_number||''} evidence`);
    const rows=await insert('artifacts',{
      student_id:student.id,
      artifact_type:isPortrait?'portrait':'image',
      title:artifactTitle,
      storage_bucket:bucket,
      storage_path:path,
      external_url:null,
      metadata:{session_number:isPortrait?null:Number(session_number)||null,kind:isPortrait?'portrait':'lesson_media',mime_type,original_name:file_name||null,uploaded_via:'studio_web'}
    });
    const signed_url=await signObject(bucket,path,3600).catch(()=>null);
    return res.status(200).json({ok:true,artifact:rows[0]||null,bucket,path,signed_url});
  }catch(error){
    console.error('Media upload error:',error);
    return res.status(500).json({error:error.message||'Media upload failed.'});
  }
}

import crypto from 'node:crypto';

const PROJECT_URL='https://lclkojyfyqhefwmkmgym.supabase.co';
const SESSION_COOKIE='studio_session';
function key(){return process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'';}
function headers(extra={}){const k=key();const h={apikey:k,'Content-Type':'application/json',...extra};if(k.startsWith('eyJ'))h.Authorization=`Bearer ${k}`;return h;}
function cookies(req){const raw=req.headers.cookie||'';return Object.fromEntries(raw.split(';').map(p=>{const i=p.indexOf('=');return i<0?['','']:[p.slice(0,i).trim(),decodeURIComponent(p.slice(i+1).trim())]}).filter(([k])=>k));}
function safeEqual(a,b){const aa=Buffer.from(String(a||'')),bb=Buffer.from(String(b||''));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);}
function sig(){const s=process.env.STUDIO_ACCESS_TOKEN||'';return s?crypto.createHmac('sha256',s).update('chongyu-studio-founder-session-v1').digest('hex'):'';}
function auth(req){const expected=process.env.STUDIO_ACCESS_TOKEN||'';const supplied=req.headers['x-studio-access-token']||'';if(supplied&&expected&&safeEqual(supplied,expected))return true;const c=cookies(req)[SESSION_COOKIE]||'';return Boolean(c&&sig()&&safeEqual(c,sig()));}
function encodePath(p){return String(p||'').split('/').map(encodeURIComponent).join('/');}
async function rest(table,q=''){const r=await fetch(`${PROJECT_URL}/rest/v1/${table}?${q}`,{headers:headers()});const t=await r.text();if(!r.ok)throw new Error(`${table}: ${r.status} ${t.slice(0,300)}`);return t?JSON.parse(t):[];}
async function signObject(bucket,path,expiresIn=3600){const r=await fetch(`${PROJECT_URL}/storage/v1/object/sign/${encodePath(bucket)}/${encodePath(path)}`,{method:'POST',headers:headers(),body:JSON.stringify({expiresIn})});const t=await r.text();if(!r.ok)throw new Error(`sign: ${r.status} ${t.slice(0,300)}`);const d=t?JSON.parse(t):{};const s=d.signedURL||d.signedUrl||'';return s?(s.startsWith('http')?s:`${PROJECT_URL}/storage/v1${s}`):null;}

export default async function handler(req,res){
  if(!auth(req))return res.status(401).json({error:'Founder session is missing or invalid.'});
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed.'});
  try{
    const slug=String(req.query?.student||'').trim().toLowerCase();
    if(!slug)return res.status(400).json({error:'Student slug is required.'});
    const students=await rest('students',`select=id,name,slug&slug=eq.${encodeURIComponent(slug)}&limit=1`);
    const student=students[0];if(!student)return res.status(404).json({error:'Student not found.'});
    const rows=await rest('artifacts',`select=id,title,storage_bucket,storage_path,created_at&student_id=eq.${encodeURIComponent(student.id)}&artifact_type=eq.portrait&order=created_at.desc&limit=1`);
    const portrait=rows[0];
    if(!portrait)return res.status(200).json({student,portrait:null});
    const signed_url=portrait.storage_bucket&&portrait.storage_path?await signObject(portrait.storage_bucket,portrait.storage_path):null;
    return res.status(200).json({student,portrait:{...portrait,signed_url}});
  }catch(e){console.error('Student portrait error',e);return res.status(500).json({error:e.message||'Student portrait failed.'});}
}
import crypto from 'node:crypto';

const PROJECT_URL='https://lclkojyfyqhefwmkmgym.supabase.co';
const SESSION_COOKIE='studio_session';
function key(){return process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'';}
function headers(extra={}){const k=key();const h={apikey:k,'Content-Type':'application/json',...extra};if(k.startsWith('eyJ'))h.Authorization=`Bearer ${k}`;return h;}
function cookies(req){const raw=req.headers.cookie||'';return Object.fromEntries(raw.split(';').map(p=>{const i=p.indexOf('=');return i<0?['','']:[p.slice(0,i).trim(),decodeURIComponent(p.slice(i+1).trim())]}).filter(([k])=>k));}
function safeEqual(a,b){const aa=Buffer.from(String(a||'')),bb=Buffer.from(String(b||''));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);}
function sig(){const s=process.env.STUDIO_ACCESS_TOKEN||'';return s?crypto.createHmac('sha256',s).update('chongyu-studio-founder-session-v1').digest('hex'):'';}
function auth(req){const expected=process.env.STUDIO_ACCESS_TOKEN||'';const supplied=req.headers['x-studio-access-token']||'';if(supplied&&expected&&safeEqual(supplied,expected))return true;const c=cookies(req)[SESSION_COOKIE]||'';return Boolean(c&&sig()&&safeEqual(c,sig()));}
async function rest(table,q=''){const r=await fetch(`${PROJECT_URL}/rest/v1/${table}${q?`?${q}`:''}`,{headers:headers()});const t=await r.text();if(!r.ok)throw new Error(`${table}: ${r.status} ${t.slice(0,300)}`);return t?JSON.parse(t):[];}
async function sign(bucket,path){const encoded=String(path||'').split('/').map(encodeURIComponent).join('/');const r=await fetch(`${PROJECT_URL}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encoded}`,{method:'POST',headers:headers(),body:JSON.stringify({expiresIn:3600})});const t=await r.text();if(!r.ok)throw new Error(`storage sign: ${r.status} ${t.slice(0,300)}`);const d=t?JSON.parse(t):{};const signed=d.signedURL||d.signedUrl||'';if(!signed)return null;return signed.startsWith('http')?signed:`${PROJECT_URL}/storage/v1${signed.startsWith('/')?'':'/'}${signed}`;}
export default async function handler(req,res){
  if(!auth(req))return res.status(401).json({error:'Founder session is missing or invalid.'});
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed.'});
  try{
    const [students,arts]=await Promise.all([
      rest('students','select=id,slug,name&order=created_at.asc'),
      rest('artifacts','select=id,student_id,artifact_type,storage_bucket,storage_path,created_at&artifact_type=eq.portrait&storage_bucket=not.is.null&storage_path=not.is.null&order=created_at.desc')
    ]);
    const latest=new Map();for(const a of arts){if(!latest.has(a.student_id))latest.set(a.student_id,a)}
    const portraits={};
    for(const s of students){const a=latest.get(s.id);if(!a)continue;try{const url=await sign(a.storage_bucket,a.storage_path);if(url)portraits[s.slug]={url,artifact_id:a.id};}catch(e){console.warn('portrait sign failed',s.slug,e.message)}}
    return res.status(200).json({ok:true,portraits});
  }catch(error){console.error('student portraits error',error);return res.status(400).json({error:error.message||'Portrait lookup failed.'});}
}

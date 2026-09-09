import crypto from 'node:crypto';

const PROJECT_URL='https://lclkojyfyqhefwmkmgym.supabase.co';
const SESSION_COOKIE='studio_session';
function key(){return process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'';}
function headers(extra={}){const k=key();const h={apikey:k,'Content-Type':'application/json',...extra};if(k.startsWith('eyJ'))h.Authorization=`Bearer ${k}`;return h;}
function cookies(req){const raw=req.headers.cookie||'';return Object.fromEntries(raw.split(';').map(p=>{const i=p.indexOf('=');return i<0?['','']:[p.slice(0,i).trim(),decodeURIComponent(p.slice(i+1).trim())]}).filter(([k])=>k));}
function safeEqual(a,b){const aa=Buffer.from(String(a||'')),bb=Buffer.from(String(b||''));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);}
function sig(){const s=process.env.STUDIO_ACCESS_TOKEN||'';return s?crypto.createHmac('sha256',s).update('chongyu-studio-founder-session-v1').digest('hex'):'';}
function auth(req){const expected=process.env.STUDIO_ACCESS_TOKEN||'';const supplied=req.headers['x-studio-access-token']||'';if(supplied&&expected&&safeEqual(supplied,expected))return true;const c=cookies(req)[SESSION_COOKIE]||'';return Boolean(c&&sig()&&safeEqual(c,sig()));}

export default async function handler(req,res){
  if(!auth(req))return res.status(401).json({error:'Founder session is missing or invalid.'});
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed.'});
  try{
    const id=String(req.body?.id||'').trim();
    if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:'Valid event id is required.'});
    const r=await fetch(`${PROJECT_URL}/rest/v1/calendar_events?id=eq.${encodeURIComponent(id)}`,{
      method:'DELETE',
      headers:headers({Prefer:'return=representation'})
    });
    const text=await r.text();
    if(!r.ok)throw new Error(`calendar_events: ${r.status} ${text.slice(0,400)}`);
    const rows=text?JSON.parse(text):[];
    return res.status(200).json({ok:true,event:rows[0]||null});
  }catch(error){
    console.error('Calendar delete error',error);
    return res.status(400).json({error:error.message||'Delete failed.'});
  }
}

import crypto from 'node:crypto';

const PROJECT_URL = 'https://lclkojyfyqhefwmkmgym.supabase.co';
const FOUNDER_COOKIE = 'studio_session';

function key(){ return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''; }
function headers(){ const k=key(); const h={apikey:k,'Content-Type':'application/json'}; if(k.startsWith('eyJ')) h.Authorization=`Bearer ${k}`; return h; }
function cookies(req){ const raw=req.headers.cookie||''; return Object.fromEntries(raw.split(';').map(p=>{const i=p.indexOf('=');return i<0?['','']:[p.slice(0,i).trim(),decodeURIComponent(p.slice(i+1).trim())]}).filter(([k])=>k)); }
function safeEqual(a,b){ const aa=Buffer.from(String(a||''));const bb=Buffer.from(String(b||''));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb); }
function founderSig(){ const s=process.env.STUDIO_ACCESS_TOKEN||''; return s?crypto.createHmac('sha256',s).update('chongyu-studio-founder-session-v1').digest('hex'):''; }
function founderAuthorized(req){ const c=cookies(req)[FOUNDER_COOKIE]||'';const sig=founderSig();return Boolean(c&&sig&&safeEqual(c,sig)); }
function parentCookie(slug){ return `cys_parent_${String(slug).replace(/[^a-z0-9_]/gi,'_')}`; }
function parentSig(slug,hash){ const s=process.env.STUDIO_ACCESS_TOKEN||'';return crypto.createHmac('sha256',s).update(`parent:${slug}:${hash}`).digest('hex'); }
function setCookie(res,name,value,maxAge){ res.setHeader('Set-Cookie',`${name}=${encodeURIComponent(value)}; Path=/parent/${encodeURIComponent(name.replace('cys_parent_',''))}; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`); }
async function rest(table,q=''){ const r=await fetch(`${PROJECT_URL}/rest/v1/${table}${q?`?${q}`:''}`,{headers:headers()});const t=await r.text();if(!r.ok)throw new Error(`${table}: ${r.status} ${t.slice(0,300)}`);return t?JSON.parse(t):[]; }

async function loadPortal(slug){
  const students=await rest('students',`select=id,slug,name,age,current_level,current_project,status&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  const student=students[0]; if(!student) return {student:null,portal:null};
  const portals=await rest('parent_portals',`select=id,student_id,access_code_hash,public_title,intro,theme,is_active&student_id=eq.${encodeURIComponent(student.id)}&limit=1`);
  return {student,portal:portals[0]||null};
}

async function portfolio(student, founder=false){
  const [skills,records,artifacts] = await Promise.all([
    rest('student_skills',`select=skill_name,score,confidence,evidence,updated_at&student_id=eq.${encodeURIComponent(student.id)}`),
    rest('student_session_records',`select=id,session_id,track,achievement,difficulty,next_step,teacher_note,evidence,created_at&student_id=eq.${encodeURIComponent(student.id)}&order=created_at.asc`),
    rest('artifacts',`select=id,artifact_type,title,storage_bucket,storage_path,external_url,metadata,created_at&student_id=eq.${encodeURIComponent(student.id)}&order=created_at.desc`)
  ]);
  const ids=[...new Set(records.map(r=>r.session_id).filter(Boolean))];
  let sessions=[];
  if(ids.length){ sessions=await rest('course_sessions',`select=id,session_number,title,summary,learning_goals,concepts,highlights,teacher_reflection,source_url,media&or=(${ids.map(id=>`id.eq.${id}`).join(',')})&order=session_number.asc`); }
  if(founder && !sessions.length){ sessions=await rest('course_sessions','select=id,session_number,title,summary,learning_goals,concepts,highlights,teacher_reflection,source_url,media&status=neq.archived&order=session_number.asc'); }
  return {skills,records,sessions,artifacts};
}

export default async function handler(req,res){
  try{
    const slug=String(req.query?.student||req.body?.student||'').trim().toLowerCase();
    if(!slug) return res.status(400).json({error:'Student slug is required.'});
    const {student,portal}=await loadPortal(slug);
    if(!student) return res.status(404).json({error:'Student not found.'});

    if(req.method==='POST'){
      if(!portal?.is_active||!portal.access_code_hash) return res.status(403).json({error:'Parent portal is not active.'});
      const code=String(req.body?.code||''); const hash=crypto.createHash('sha256').update(code).digest('hex');
      if(!safeEqual(hash,portal.access_code_hash)) return res.status(401).json({error:'Invalid access code.'});
      const name=parentCookie(slug); const sig=parentSig(slug,portal.access_code_hash);
      res.setHeader('Set-Cookie',`${name}=${encodeURIComponent(sig)}; Path=/; Max-Age=${60*60*24*14}; HttpOnly; Secure; SameSite=Strict`);
      return res.status(200).json({ok:true});
    }

    if(req.method==='DELETE'){
      res.setHeader('Set-Cookie',`${parentCookie(slug)}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
      return res.status(200).json({ok:true});
    }

    if(req.method!=='GET') return res.status(405).json({error:'Method not allowed.'});
    const founder=founderAuthorized(req);
    const parentOk=Boolean(portal?.is_active&&portal.access_code_hash&&safeEqual(cookies(req)[parentCookie(slug)]||'',parentSig(slug,portal.access_code_hash)));
    if(!founder&&!parentOk) return res.status(401).json({requires_code:true,portal_active:Boolean(portal?.is_active),student:{slug:student.slug,name:student.name}});
    const data=await portfolio(student,founder);
    return res.status(200).json({student,portal:portal?{public_title:portal.public_title,intro:portal.intro,theme:portal.theme,is_active:portal.is_active}:null,...data,founder_preview:founder});
  }catch(error){ console.error('Parent portal error:',error); return res.status(500).json({error:error.message||'Parent portal failed.'}); }
}

import crypto from 'node:crypto';

const PROJECT_URL='https://lclkojyfyqhefwmkmgym.supabase.co';
const SESSION_COOKIE='studio_session';
function key(){return process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'';}
function headers(){const k=key();const h={apikey:k,'Content-Type':'application/json'};if(k.startsWith('eyJ'))h.Authorization=`Bearer ${k}`;return h;}
function cookies(req){const raw=req.headers.cookie||'';return Object.fromEntries(raw.split(';').map(p=>{const i=p.indexOf('=');return i<0?['','']:[p.slice(0,i).trim(),decodeURIComponent(p.slice(i+1).trim())]}).filter(([k])=>k));}
function safeEqual(a,b){const aa=Buffer.from(String(a||''));const bb=Buffer.from(String(b||''));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);}
function sig(){const s=process.env.STUDIO_ACCESS_TOKEN||'';return s?crypto.createHmac('sha256',s).update('chongyu-studio-founder-session-v1').digest('hex'):'';}
function authorized(req){const expected=process.env.STUDIO_ACCESS_TOKEN||'';if(!expected)return false;const supplied=req.headers['x-studio-access-token']||'';if(supplied&&safeEqual(supplied,expected))return true;const c=cookies(req)[SESSION_COOKIE]||'';const s=sig();return Boolean(c&&s&&safeEqual(c,s));}
async function rest(table,q=''){const r=await fetch(`${PROJECT_URL}/rest/v1/${table}?${q}`,{headers:headers()});const t=await r.text();if(!r.ok)throw new Error(`${table}: ${r.status} ${t.slice(0,300)}`);return t?JSON.parse(t):[];}
export default async function handler(req,res){
 if(!authorized(req))return res.status(401).json({error:'Founder session is missing or invalid.'});
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed.'});
 try{
  const specs=[
   ['students','select=id,slug,name,age,current_level,current_project,status,progress,parent_notes,translations&status=eq.active&order=name.asc'],
   ['lessons','select=id,student_id,lesson_number,lesson_date,title,plan,summary,achievement,difficulty,next_step,created_at&order=lesson_date.asc'],
   ['student_skills','select=student_id,skill_name,score,confidence,evidence,translations,updated_at'],
   ['course_sessions','select=id,session_number,title,summary,learning_goals,concepts,highlights,teacher_reflection,source_platform,source_url,media,status,translations,created_at,updated_at&status=neq.archived&order=session_number.asc'],
   ['student_session_records','select=id,session_id,student_id,track,achievement,difficulty,next_step,teacher_note,evidence,translations,created_at,updated_at&order=created_at.asc'],
   ['artifacts','select=id,student_id,lesson_id,project_id,artifact_type,title,storage_bucket,storage_path,external_url,metadata,created_at&order=created_at.desc'],
   ['parent_portals','select=id,student_id,public_title,intro,theme,is_active,created_at,updated_at&order=created_at.asc'],
   ['content_items','select=id,title,platform,pillar,hook,body,status,source_type,source_label,published_at,translations,created_at,updated_at&status=neq.archived&order=updated_at.desc'],
   ['content_metrics','select=content_id,captured_at,views,likes,comments,saves,followers_gained,leads&order=captured_at.desc'],
   ['company_brain','select=id,brain_type,title,body,evidence,status,created_by,approved_by,created_at,updated_at&status=neq.archived&order=updated_at.desc'],
   ['decisions','select=id,topic,context,decision,rationale,status,proposed_by,approved_by,created_at,approved_at&order=created_at.desc'],
   ['inbox_items','select=id,input_type,raw_content,classification,status,created_at&order=created_at.desc&limit=50'],
   ['memory_items','select=id,memory_type,entity_type,entity_ref,title,summary,details,source_type,source_ref,importance,status,created_by,approved_by,created_at,updated_at&status=neq.archived&order=importance.desc,updated_at.desc&limit=100']
  ];
  const entries=await Promise.all(specs.map(async([n,q])=>[n,await rest(n,q)]));
  return res.status(200).json({source:'supabase',project:'chongyu-studio-os',data:Object.fromEntries(entries)});
 }catch(e){console.error(e);return res.status(500).json({error:e.message||'Bootstrap failed.'});}
}
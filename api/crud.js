import crypto from 'node:crypto';

const PROJECT_URL='https://lclkojyfyqhefwmkmgym.supabase.co';
const COOKIE='studio_session';
function key(){return process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||''}
function cookies(req){return Object.fromEntries(String(req.headers.cookie||'').split(';').map(p=>{const i=p.indexOf('=');return i<0?['','']:[p.slice(0,i).trim(),decodeURIComponent(p.slice(i+1).trim())]}).filter(([k])=>k))}
function safeEqual(a,b){const aa=Buffer.from(String(a||'')),bb=Buffer.from(String(b||''));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb)}
function sig(){const s=process.env.STUDIO_ACCESS_TOKEN||'';return s?crypto.createHmac('sha256',s).update('chongyu-studio-founder-session-v1').digest('hex'):''}
function authorized(req){const expected=process.env.STUDIO_ACCESS_TOKEN||'';if(!expected)return false;const supplied=req.headers['x-studio-access-token']||'';if(supplied&&safeEqual(supplied,expected))return true;const c=cookies(req)[COOKIE]||'',s=sig();return Boolean(c&&s&&safeEqual(c,s))}
function headers(extra={}){const k=key();const h={apikey:k,'Content-Type':'application/json',...extra};if(k.startsWith('eyJ'))h.Authorization=`Bearer ${k}`;return h}
async function rest(table,q='',opts={}){const r=await fetch(`${PROJECT_URL}/rest/v1/${table}${q?`?${q}`:''}`,{...opts,headers:headers(opts.headers||{})});const t=await r.text();if(!r.ok)throw new Error(`${table}: ${r.status} ${t.slice(0,500)}`);return t?JSON.parse(t):[]}
const text=(v,n=50000)=>String(v??'').trim().slice(0,n);
const num=(v,min,max,f=null)=>{const x=Number(v);return Number.isFinite(x)?Math.min(max,Math.max(min,x)):f};
function slugify(v){return text(v,120).toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'')}
function arrays(v){if(Array.isArray(v))return v.map(x=>String(x).trim()).filter(Boolean);return String(v||'').split('\n').map(x=>x.trim()).filter(Boolean)}
async function list(entity){
 if(entity==='students')return rest('students','select=id,slug,name,age,current_level,current_project,status,progress,parent_notes,created_at,updated_at&order=name.asc');
 if(entity==='lesson_plans')return rest('lesson_plans','select=id,student_id,title,planned_session_number,scheduled_for,goals,agenda,prep_notes,materials,status,created_at,updated_at&order=scheduled_for.asc.nullslast,created_at.desc');
 if(entity==='content_items')return rest('content_items','select=id,title,platform,pillar,hook,body,status,source_type,source_label,published_at,created_at,updated_at&status=neq.archived&order=updated_at.desc');
 throw new Error('Unsupported entity');
}
async function create(entity,p){
 if(entity==='students'){
   const name=text(p.name,200),slug=slugify(p.slug||p.name);if(!name||!slug)throw new Error('Name is required.');
   return rest('students','',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({name,slug,age:num(p.age,1,120,null),current_level:text(p.current_level,300)||null,current_project:text(p.current_project,500)||null,status:['active','paused','completed'].includes(p.status)?p.status:'active',progress:num(p.progress,0,100,null),parent_notes:text(p.parent_notes)||null,translations:{}})});
 }
 if(entity==='lesson_plans'){
   if(!p.student_id||!text(p.title,500))throw new Error('Student and title are required.');
   return rest('lesson_plans','',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({student_id:p.student_id,title:text(p.title,500),planned_session_number:num(p.planned_session_number,0,10000,null),scheduled_for:p.scheduled_for||null,goals:arrays(p.goals),agenda:arrays(p.agenda),prep_notes:text(p.prep_notes)||null,materials:arrays(p.materials),status:['planned','ready','completed','archived'].includes(p.status)?p.status:'planned'})});
 }
 if(entity==='content_items'){
   if(!text(p.title,500))throw new Error('Title is required.');
   return rest('content_items','',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({title:text(p.title,500),platform:text(p.platform,120)||'Rednote',pillar:text(p.pillar,300)||null,hook:text(p.hook)||null,body:text(p.body)||null,status:['idea','draft','ready','published','archived'].includes(p.status)?p.status:'idea',source_type:text(p.source_type,120)||'studio_web',source_label:text(p.source_label,500)||null,published_at:p.status==='published'?(p.published_at||new Date().toISOString()):null,translations:{}})});
 }
 throw new Error('Unsupported entity');
}
async function update(entity,id,p){
 const allow={students:new Set(['name','slug','age','current_level','current_project','status','progress','parent_notes']),lesson_plans:new Set(['student_id','title','planned_session_number','scheduled_for','goals','agenda','prep_notes','materials','status']),content_items:new Set(['title','platform','pillar','hook','body','status','source_label','published_at'])};
 if(!allow[entity])throw new Error('Unsupported entity');
 const body={};for(const [k,v] of Object.entries(p||{}))if(allow[entity].has(k))body[k]=v;
 if(entity==='students'&&'slug'in body)body.slug=slugify(body.slug);
 if(entity==='students'&&'age'in body)body.age=num(body.age,1,120,null);
 if(entity==='students'&&'progress'in body)body.progress=num(body.progress,0,100,null);
 if(entity==='lesson_plans'){if('planned_session_number'in body)body.planned_session_number=num(body.planned_session_number,0,10000,null);for(const k of ['goals','agenda','materials'])if(k in body)body[k]=arrays(body[k]);}
 if(entity==='content_items'&&body.status==='published'&&!body.published_at)body.published_at=new Date().toISOString();
 return rest(entity,`id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(body)});
}
async function remove(entity,id){if(!['students','lesson_plans','content_items'].includes(entity))throw new Error('Unsupported entity');return rest(entity,`id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers:{Prefer:'return=representation'}})}
export default async function handler(req,res){
 if(!authorized(req))return res.status(401).json({error:'Founder session required.'});
 try{
   if(req.method==='GET'){return res.status(200).json({ok:true,items:await list(String(req.query?.entity||''))})}
   if(req.method!=='POST')return res.status(405).json({error:'Method not allowed.'});
   const {action,entity,id,payload}=req.body||{};
   let rows;if(action==='create')rows=await create(entity,payload||{});else if(action==='update')rows=await update(entity,id,payload||{});else if(action==='delete')rows=await remove(entity,id);else throw new Error('Unknown action.');
   return res.status(200).json({ok:true,item:rows?.[0]||null});
 }catch(e){console.error('CRUD error',e);const status=/required|unsupported|unknown|Name is|Title is/i.test(e.message||'')?400:500;return res.status(status).json({error:e.message||'CRUD failed.'})}
}

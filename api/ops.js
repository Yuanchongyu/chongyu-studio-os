import crypto from 'node:crypto';

const PROJECT_URL='https://lclkojyfyqhefwmkmgym.supabase.co';
const SESSION_COOKIE='studio_session';
function key(){return process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'';}
function headers(extra={}){const k=key();const h={apikey:k,'Content-Type':'application/json',...extra};if(k.startsWith('eyJ'))h.Authorization=`Bearer ${k}`;return h;}
function cookies(req){const raw=req.headers.cookie||'';return Object.fromEntries(raw.split(';').map(p=>{const i=p.indexOf('=');return i<0?['','']:[p.slice(0,i).trim(),decodeURIComponent(p.slice(i+1).trim())]}).filter(([k])=>k));}
function safeEqual(a,b){const aa=Buffer.from(String(a||'')),bb=Buffer.from(String(b||''));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);}
function sig(){const s=process.env.STUDIO_ACCESS_TOKEN||'';return s?crypto.createHmac('sha256',s).update('chongyu-studio-founder-session-v1').digest('hex'):'';}
function auth(req){const expected=process.env.STUDIO_ACCESS_TOKEN||'';const supplied=req.headers['x-studio-access-token']||'';if(supplied&&expected&&safeEqual(supplied,expected))return true;const c=cookies(req)[SESSION_COOKIE]||'';return Boolean(c&&sig()&&safeEqual(c,sig()));}
async function rest(table,q=''){const r=await fetch(`${PROJECT_URL}/rest/v1/${table}${q?`?${q}`:''}`,{headers:headers()});const t=await r.text();if(!r.ok)throw new Error(`${table}: ${r.status} ${t.slice(0,400)}`);return t?JSON.parse(t):[];}
async function insert(table,body){const r=await fetch(`${PROJECT_URL}/rest/v1/${table}`,{method:'POST',headers:headers({Prefer:'return=representation'}),body:JSON.stringify(body)});const t=await r.text();if(!r.ok)throw new Error(`${table}: ${r.status} ${t.slice(0,400)}`);return t?JSON.parse(t):[];}
async function patch(table,q,body){const r=await fetch(`${PROJECT_URL}/rest/v1/${table}?${q}`,{method:'PATCH',headers:headers({Prefer:'return=representation'}),body:JSON.stringify(body)});const t=await r.text();if(!r.ok)throw new Error(`${table}: ${r.status} ${t.slice(0,400)}`);return t?JSON.parse(t):[];}
async function upsert(table,body,onConflict){const r=await fetch(`${PROJECT_URL}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`,{method:'POST',headers:headers({Prefer:'resolution=merge-duplicates,return=representation'}),body:JSON.stringify(body)});const t=await r.text();if(!r.ok)throw new Error(`${table}: ${r.status} ${t.slice(0,400)}`);return t?JSON.parse(t):[];}
const text=(v,n=50000)=>String(v??'').trim().slice(0,n);
async function studentId(payload){if(payload?.student_id)return String(payload.student_id);const slug=text(payload?.student_slug,120);if(!slug)return null;const rows=await rest('students',`select=id&slug=eq.${encodeURIComponent(slug)}&limit=1`);return rows[0]?.id||null;}
async function bootstrap(){
  const specs=[
    ['lesson_plans','select=id,student_id,title,planned_session_number,scheduled_for,goals,agenda,prep_notes,materials,status,created_at,updated_at&status=neq.archived&order=scheduled_for.asc.nullslast,created_at.desc'],
    ['calendar_events','select=id,student_id,title,start_at,end_at,event_type,location,notes,status,created_at,updated_at&status=neq.cancelled&order=start_at.asc'],
    ['action_items','select=id,title,description,student_id,due_at,priority,status,source_type,source_ref,created_at,updated_at&status=neq.archived&order=due_at.asc.nullslast,created_at.desc'],
    ['daily_briefs','select=id,brief_date,summary,review,urgent_items,upcoming_items,ideas,source_snapshot,generated_by,created_at,updated_at&order=brief_date.desc&limit=14']
  ];
  const e=await Promise.all(specs.map(async([n,q])=>[n,await rest(n,q)]));return Object.fromEntries(e);
}
function localDay(v){return /^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?String(v):new Date().toISOString().slice(0,10);}
async function refreshBrief(payload){
  const day=localDay(payload.local_date);
  const [actions,events,plans,content,students]=await Promise.all([
    rest('action_items','select=id,title,due_at,priority,status&status=eq.open'),
    rest('calendar_events','select=id,student_id,title,start_at,end_at,event_type,status&status=eq.scheduled&order=start_at.asc'),
    rest('lesson_plans','select=id,student_id,title,planned_session_number,scheduled_for,status&status=in.(planned,ready)&order=scheduled_for.asc.nullslast'),
    rest('content_items','select=id,title,status,platform,updated_at&status=neq.archived&order=updated_at.desc'),
    rest('students','select=id,name,slug&status=eq.active')
  ]);
  const now=Date.now(),h48=now+48*3600e3,w7=now+7*86400e3;
  const urgent=actions.filter(x=>x.priority==='urgent'||x.priority==='high'||(x.due_at&&new Date(x.due_at).getTime()<=h48)).slice(0,8).map(x=>({title:x.title,due_at:x.due_at,priority:x.priority}));
  const upcoming=events.filter(x=>new Date(x.start_at).getTime()>=now&&new Date(x.start_at).getTime()<=w7).slice(0,10).map(x=>({title:x.title,start_at:x.start_at,event_type:x.event_type,student_id:x.student_id}));
  const drafts=content.filter(x=>x.status==='draft'||x.status==='ready');const ideas=content.filter(x=>x.status==='idea');
  const ideaList=[];
  if(drafts.length)ideaList.push({title:'推进一篇已成型内容',reason:`目前有 ${drafts.length} 篇草稿/待发布内容，可优先完成最接近发布的一篇。`});
  if(ideas.length)ideaList.push({title:'从灵感池挑一个低成本选题',reason:`当前有 ${ideas.length} 个灵感，可结合最近课堂证据快速做成短内容。`});
  if(plans.length)ideaList.push({title:'把最近一次备课变成可复用课程模板',reason:'备课完成后同步沉淀目标、流程、素材与课堂变体，减少下次重复准备。'});
  if(!ideaList.length)ideaList.push({title:'补充一个真实课堂故事',reason:'从最近一节课里提取“学生遇到问题→主动解决→能力变化”的故事，作为内容与家长反馈素材。'});
  const summary=`${students.length} 名活跃学生 · ${upcoming.length} 个未来 7 天日程 · ${plans.length} 个待执行备课 · ${drafts.length} 篇草稿/待发布内容。`;
  const review=urgent.length?`今天优先处理 ${urgent.length} 个高优先级事项，再围绕最近课程安排完成备课与内容收尾。`:'目前没有明确的高优先级阻塞项，可以把重点放在下一次课程准备和内容资产沉淀上。';
  const snapshot={active_students:students.length,upcoming_7d:upcoming.length,open_plans:plans.length,drafts:drafts.length,ideas:ideas.length,open_actions:actions.length};
  const rows=await upsert('daily_briefs',{brief_date:day,summary,review,urgent_items:urgent,upcoming_items:upcoming,ideas:ideaList,source_snapshot:snapshot,generated_by:'studio_ops'},'brief_date');
  return rows[0]||null;
}
export default async function handler(req,res){
  if(!auth(req))return res.status(401).json({error:'Founder session is missing or invalid.'});
  try{
    if(req.method==='GET')return res.status(200).json({ok:true,data:await bootstrap()});
    if(req.method!=='POST')return res.status(405).json({error:'Method not allowed.'});
    const {action,payload={}}=req.body||{};
    if(action==='refresh_daily_brief')return res.status(200).json({ok:true,brief:await refreshBrief(payload)});
    if(action==='create_calendar_event'){
      const title=text(payload.title,500),start_at=payload.start_at;if(!title||!start_at)throw new Error('Title and start time are required.');
      const rows=await insert('calendar_events',{student_id:await studentId(payload),title,start_at,end_at:payload.end_at||null,event_type:['lesson','prep','content','admin','other'].includes(payload.event_type)?payload.event_type:'lesson',location:text(payload.location,500)||null,notes:text(payload.notes)||null,status:'scheduled'});return res.status(200).json({ok:true,event:rows[0]||null});
    }
    if(action==='create_lesson_plan'){
      const sid=await studentId(payload),title=text(payload.title,500);if(!sid||!title)throw new Error('Student and title are required.');
      const rows=await insert('lesson_plans',{student_id:sid,title,planned_session_number:Number.isFinite(Number(payload.planned_session_number))?Number(payload.planned_session_number):null,scheduled_for:payload.scheduled_for||null,goals:Array.isArray(payload.goals)?payload.goals:[],agenda:Array.isArray(payload.agenda)?payload.agenda:[],prep_notes:text(payload.prep_notes)||null,materials:Array.isArray(payload.materials)?payload.materials:[],status:['planned','ready','completed'].includes(payload.status)?payload.status:'planned'});return res.status(200).json({ok:true,plan:rows[0]||null});
    }
    if(action==='create_action_item'){
      const title=text(payload.title,500);if(!title)throw new Error('Action title is required.');
      const rows=await insert('action_items',{title,description:text(payload.description)||null,student_id:await studentId(payload),due_at:payload.due_at||null,priority:['low','normal','high','urgent'].includes(payload.priority)?payload.priority:'normal',status:'open',source_type:text(payload.source_type,120)||null,source_ref:text(payload.source_ref,500)||null});return res.status(200).json({ok:true,item:rows[0]||null});
    }
    if(action==='update_action_item'){
      const id=text(payload.id,120);if(!id)throw new Error('Action id is required.');const body={};if(['open','done','archived'].includes(payload.status))body.status=payload.status;if(['low','normal','high','urgent'].includes(payload.priority))body.priority=payload.priority;if(payload.due_at!==undefined)body.due_at=payload.due_at||null;body.updated_at=new Date().toISOString();const rows=await patch('action_items',`id=eq.${encodeURIComponent(id)}`,body);return res.status(200).json({ok:true,item:rows[0]||null});
    }
    throw new Error('Unknown action.');
  }catch(error){console.error('Studio ops error',error);return res.status(400).json({error:error.message||'Studio ops failed.'});}
}

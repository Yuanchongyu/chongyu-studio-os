const PROJECT_URL='https://lclkojyfyqhefwmkmgym.supabase.co';

function key(){return process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'';}
function headers(extra={}){const k=key();const h={apikey:k,'Content-Type':'application/json',...extra};if(k.startsWith('eyJ'))h.Authorization=`Bearer ${k}`;return h;}
async function rest(table,q=''){const r=await fetch(`${PROJECT_URL}/rest/v1/${table}${q?`?${q}`:''}`,{headers:headers()});const t=await r.text();if(!r.ok)throw new Error(`${table}: ${r.status} ${t.slice(0,400)}`);return t?JSON.parse(t):[];}
async function insert(table,body){const r=await fetch(`${PROJECT_URL}/rest/v1/${table}`,{method:'POST',headers:headers({Prefer:'return=representation'}),body:JSON.stringify(body)});const t=await r.text();if(!r.ok)throw new Error(`${table}: ${r.status} ${t.slice(0,400)}`);return t?JSON.parse(t):[];}
async function patch(table,q,body){const r=await fetch(`${PROJECT_URL}/rest/v1/${table}?${q}`,{method:'PATCH',headers:headers({Prefer:'return=representation'}),body:JSON.stringify(body)});const t=await r.text();if(!r.ok)throw new Error(`${table}: ${r.status} ${t.slice(0,400)}`);return t?JSON.parse(t):[];}

function parseJson(text){
  const clean=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/```$/,'').trim();
  try{return JSON.parse(clean);}catch(_){const a=clean.indexOf('{'),b=clean.lastIndexOf('}');if(a>=0&&b>a)return JSON.parse(clean.slice(a,b+1));throw new Error('Workflow model returned invalid JSON.');}
}

async function callOpenAI(instructions,input){
  const apiKey=process.env.OPENAI_API_KEY;if(!apiKey)throw new Error('OPENAI_API_KEY is not configured in Vercel.');
  const model=process.env.OPENAI_MODEL||'gpt-5.6-sol';
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model,instructions,input})});
  const d=await r.json();if(!r.ok)throw new Error(d?.error?.message||`OpenAI request failed (${r.status}).`);
  const text=d.output_text||((d.output||[]).flatMap(x=>x.content||[]).map(x=>x.text||'').join('\n'));
  return {model,data:parseJson(text)};
}

function workflowPrompt(students,recentLessons){
  return `You are running the post-class workflow for Chongyu Studio OS. Return JSON only. Never invent facts. The founder has provided a raw lesson recap.\n\nKNOWN STUDENTS\n${JSON.stringify(students)}\n\nRECENT LESSONS\n${JSON.stringify(recentLessons)}\n\nReturn exactly this shape:\n{\n  \"is_post_class_recap\": true|false,\n  \"lesson_date\": \"YYYY-MM-DD\",\n  \"students\": [\n    {\n      \"slug\": \"existing student slug only\",\n      \"lesson_number\": number|null,\n      \"title\": \"concise factual lesson title\",\n      \"summary\": \"what actually happened\",\n      \"achievement\": \"specific observable outcome\",\n      \"difficulty\": \"specific difficulty or empty string\",\n      \"next_step\": \"concrete next direction\",\n      \"parent_update\": \"short factual parent-friendly update\",\n      \"skill_signals\": [{\"skill_name\":\"short stable skill name\",\"score\":0-100,\"confidence\":0-1,\"evidence\":\"specific evidence from recap\"}]\n    }\n  ],\n  \"content\": {\n    \"publishable\": true|false,\n    \"story_angle\": \"strongest before-to-after/problem-solution angle or empty\",\n    \"title\": \"Xiaohongshu title or empty\",\n    \"hook\": \"hook or empty\",\n    \"body\": \"concise draft body or empty\",\n    \"pillar\": \"Student Growth|AI Fundamentals|Engineering Journey|Physical AI|Creative AI|Teaching Insight\"\n  }\n}\n\nRules: identify only students supported by the recap; use existing slugs; if multiple students shared one class, keep separate student records but one shared content draft at most; only mark publishable when there is concrete evidence plus a visible change, tension/problem-solution, or student agency; do not create filler content; do not invent quotes, emotions, parent reactions, or outcomes.`;
}

export function looksLikePostClassRecap(text){
  const s=String(text||'');
  return /(刚上完|刚上了|上完.*课|今天.*上课|今天课堂|这节课(我们|他|她|孩子)|课后复盘|刚结束.*课|class.*just finished|post[- ]?class|today.*class)/i.test(s);
}

export async function runLessonWorkflow(rawNote,{force=false}={}){
  if(!force&&!looksLikePostClassRecap(rawNote))return {triggered:false,reason:'not_post_class_recap'};
  const students=await rest('students','select=id,slug,name,age,current_level,current_project,status&status=eq.active&order=name.asc');
  const recent=await rest('lessons','select=student_id,lesson_number,lesson_date,title,summary,achievement,difficulty,next_step&order=lesson_date.desc,created_at.desc&limit=40');
  const {model,data}=await callOpenAI(workflowPrompt(students,recent),String(rawNote).slice(0,30000));
  if(!data?.is_post_class_recap)return {triggered:false,reason:'model_rejected'};

  const bySlug=Object.fromEntries(students.map(s=>[String(s.slug).toLowerCase(),s]));
  const lessonRows=[];const skillRows=[];const parentRows=[];
  for(const item of Array.isArray(data.students)?data.students:[]){
    const s=bySlug[String(item.slug||'').toLowerCase()];if(!s)continue;
    const lesson=(await insert('lessons',{student_id:s.id,lesson_number:Number.isFinite(Number(item.lesson_number))?Number(item.lesson_number):null,lesson_date:data.lesson_date||new Date().toISOString().slice(0,10),title:String(item.title||'课后记录').slice(0,500),raw_notes:String(rawNote).slice(0,50000),summary:String(item.summary||'').slice(0,12000)||null,achievement:String(item.achievement||'').slice(0,12000)||null,difficulty:String(item.difficulty||'').slice(0,12000)||null,next_step:String(item.next_step||'').slice(0,12000)||null,ai_generated:true}))[0];
    if(!lesson)continue;lessonRows.push({...lesson,student_name:s.name,student_slug:s.slug});

    for(const sig of Array.isArray(item.skill_signals)?item.skill_signals:[]){
      if(!sig?.skill_name||!sig?.evidence)continue;
      const existing=await rest('student_skills',`select=id&student_id=eq.${encodeURIComponent(s.id)}&skill_name=eq.${encodeURIComponent(String(sig.skill_name).slice(0,200))}&limit=1`);
      const body={score:Math.max(0,Math.min(100,Number(sig.score)||0)),confidence:Math.max(0,Math.min(1,Number(sig.confidence)||0)),evidence:String(sig.evidence).slice(0,12000),source_lesson_id:lesson.id,updated_at:new Date().toISOString()};
      if(existing[0]?.id){const rows=await patch('student_skills',`id=eq.${encodeURIComponent(existing[0].id)}`,body);skillRows.push(...rows);}else{const rows=await insert('student_skills',{student_id:s.id,skill_name:String(sig.skill_name).slice(0,200),...body,translations:{}});skillRows.push(...rows);}
    }

    if(item.parent_update){const rows=await insert('parent_updates',{student_id:s.id,lesson_id:lesson.id,update_type:'lesson_progress',draft:String(item.parent_update).slice(0,12000),status:'draft'});parentRows.push(...rows);}
  }

  let contentRow=null;
  if(data.content?.publishable&&lessonRows.length&&data.content.title&&data.content.body){
    contentRow=(await insert('content_items',{title:String(data.content.title).slice(0,500),platform:'Rednote',pillar:String(data.content.pillar||'Student Growth').slice(0,120),hook:String(data.content.hook||'').slice(0,12000)||null,body:String(data.content.body).slice(0,50000),status:'draft',source_type:'lesson_session',source_id:lessonRows[0].id,source_label:`${lessonRows.map(x=>x.student_name).join(' + ')} · Lesson ${lessonRows[0].lesson_number||''}`.trim(),translations:{}}))[0]||null;
  }

  const writeback={triggered:true,lessons:lessonRows.map(x=>x.id),student_skills:skillRows.map(x=>x.id),parent_updates:parentRows.map(x=>x.id),content_item:contentRow?.id||null,publishable:Boolean(data.content?.publishable)};
  await insert('ai_runs',{model_provider:'openai',model_name:model,agent_name:'Education Manager → Content Growth Manager',skill_name:'process_lesson',user_request:String(rawNote).slice(0,12000),context_manifest:{student_slugs:lessonRows.map(x=>x.student_slug)},output_summary:JSON.stringify({students:data.students?.map(x=>x.slug),story_angle:data.content?.story_angle,publishable:data.content?.publishable}).slice(0,4000),writeback_manifest:writeback});
  return {...writeback,story_angle:data.content?.story_angle||'',content_title:contentRow?.title||null};
}

(() => {
  const state = window.STUDIO_LIVE_STATE = { mode: 'locked', loadedAt: null, error: null };
  const langNow = () => (typeof lang !== 'undefined' ? lang : 'en');
  const bi = (en, zh) => ({ en, zh });

  async function sessionStatus() {
    try {
      const r = await fetch('/api/session', { credentials: 'same-origin' });
      const data = await r.json().catch(() => ({}));
      return Boolean(r.ok && data.authenticated);
    } catch (_) { return false; }
  }

  async function unlockFounderSession() {
    const token = window.prompt(langNow() === 'zh'
      ? '请输入 Studio Access Token。验证后会用安全的 HttpOnly Cookie 记住这台浏览器 30 天。'
      : 'Enter your Studio Access Token. A secure HttpOnly cookie will remember this browser for 30 days.') || '';
    if (!token) return false;
    const r = await fetch('/api/session', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      alert(data.error || (langNow() === 'zh' ? 'Access Token 不正确' : 'Invalid access token'));
      return false;
    }
    return true;
  }

  function configureOperatingMode() {
    const aiBar = document.querySelector('.ai-bar');
    if (aiBar) aiBar.style.display = 'none';
    const modelBtn = document.getElementById('modelBtn');
    if (modelBtn) {
      modelBtn.textContent = langNow() === 'zh' ? 'ChatGPT · 主 AI 操作员' : 'ChatGPT · Primary AI Operator';
      modelBtn.disabled = true;
    }
  }

  function setMemoryStatus(mode, detail = '') {
    const el = document.getElementById('memoryStatus');
    if (!el) return;
    if (mode === 'live') el.textContent = langNow() === 'zh' ? '● Supabase 公司记忆在线' : '● Supabase company memory online';
    else if (mode === 'error') el.textContent = langNow() === 'zh' ? `记忆连接失败${detail ? ` · ${detail}` : ''}` : `Memory connection failed${detail ? ` · ${detail}` : ''}`;
    else el.textContent = langNow() === 'zh' ? '🔒 点击连接公司记忆' : '🔒 Click to connect company memory';
    el.style.cursor = 'pointer';
    el.onclick = () => connectStudioMemory(true);
  }

  function latestMetric(metrics, contentId) {
    return metrics.find(m => m.content_id === contentId) || null;
  }

  function hydrate(raw) {
    const rows = raw.data || {};
    const lessonsByStudent = new Map();
    for (const l of rows.lessons || []) {
      if (!lessonsByStudent.has(l.student_id)) lessonsByStudent.set(l.student_id, []);
      lessonsByStudent.get(l.student_id).push(l);
    }
    for (const list of lessonsByStudent.values()) list.sort((a,b) => Number(a.lesson_number || 0) - Number(b.lesson_number || 0));

    const skillsByStudent = new Map();
    for (const s of rows.student_skills || []) {
      if (!skillsByStudent.has(s.student_id)) skillsByStudent.set(s.student_id, {});
      skillsByStudent.get(s.student_id)[s.skill_name] = Number(s.score || 0);
    }

    const sessionRows = rows.course_sessions || [];
    const sessionMap = new Map(sessionRows.map(s => [s.id, s]));
    const studentSessionMap = new Map();
    for (const rec of rows.student_session_records || []) {
      if (!studentSessionMap.has(rec.student_id)) studentSessionMap.set(rec.student_id, []);
      const session = sessionMap.get(rec.session_id);
      if (session) studentSessionMap.get(rec.student_id).push({ ...rec, session });
    }

    D.students = (rows.students || []).map(s => ({
      id: s.slug, dbId: s.id, name: s.name, age: s.age,
      level: bi(s.current_level || 'Project-Based AI Builder', s.current_level || '项目式 AI Builder'),
      project: bi(s.current_project || '', s.current_project || ''),
      progress: s.progress == null ? null : Number(s.progress),
      status: bi(s.status || 'active', s.status === 'active' ? '学习中' : (s.status || '')),
      parentNotes: s.parent_notes || '',
      skills: skillsByStudent.get(s.id) || {},
      lessons: (lessonsByStudent.get(s.id) || []).map(l => ({
        id:l.id,n:l.lesson_number||0,title:bi(l.title||'',l.title||''),date:l.lesson_date||'',
        achievement:bi(l.achievement||l.summary||'',l.achievement||l.summary||''),
        difficulty:bi(l.difficulty||'',l.difficulty||''),nextStep:bi(l.next_step||'',l.next_step||'')
      })),
      sessions: (studentSessionMap.get(s.id) || []).map(r => ({
        id:r.session.id,n:r.session.session_number,title:bi(r.session.title||'',r.session.title||''),
        track:bi(r.track||'',r.track||''),achievement:bi(r.achievement||'',r.achievement||''),
        difficulty:bi(r.difficulty||'',r.difficulty||''),nextStep:bi(r.next_step||'',r.next_step||''),
        teacherNote:bi(r.teacher_note||'',r.teacher_note||''),evidence:r.evidence||[],session:r.session
      }))
    }));

    D.sessions = sessionRows.map(s => ({
      id:s.id,n:s.session_number,title:bi(s.title||'',s.title||''),summary:bi(s.summary||'',s.summary||''),
      goals:s.learning_goals||[],concepts:s.concepts||[],highlights:s.highlights||[],reflection:bi(s.teacher_reflection||'',s.teacher_reflection||''),
      sourceUrl:s.source_url||'',sourcePlatform:s.source_platform||'',media:s.media||[],status:s.status||'published'
    }));

    D.artifacts = rows.artifacts || [];
    D.parentPortals = (rows.parent_portals || []).map(p => ({ ...p, student: D.students.find(s => s.dbId === p.student_id) || null }));

    D.content = (rows.content_items || []).map(c => {
      const m = latestMetric(rows.content_metrics || [], c.id);
      return {
        id:c.id,title:bi(c.title||'',c.title||''),pillar:bi(c.pillar||'',c.pillar||''),
        status:c.status ? c.status.charAt(0).toUpperCase()+c.status.slice(1) : 'Idea',
        views:m?.views??null,saves:m?.saves??null,leads:m?.leads??null,
        source:bi(c.source_label||c.source_type||'',c.source_label||c.source_type||''),
        hook:bi(c.hook||'',c.hook||''),body:bi(c.body||'',c.body||'')
      };
    });

    D.brain = (rows.company_brain || []).map(b => ({
      id:b.id,type:bi(b.brain_type||'Insight',b.brain_type||'洞察'),title:bi(b.title||'',b.title||''),body:bi(b.body||'',b.body||''),
      evidence:Array.isArray(b.evidence)?b.evidence.map(x=>bi(String(x),String(x))):[]
    }));
    const durable = (rows.memory_items || []).filter(x => x.status === 'active').map(m => ({
      id:m.id,type:bi(`Durable · ${m.memory_type||'memory'}`,`长期记忆 · ${m.memory_type||'memory'}`),title:bi(m.title||'',m.title||''),body:bi(m.summary||'',m.summary||''),evidence:[]
    }));
    D.brain = [...durable, ...D.brain];

    D.inbox = (rows.inbox_items || []).map(i => ({
      id:i.id,type:bi(i.input_type||'Note',i.input_type||'记录'),title:bi(i.raw_content||'',i.raw_content||''),
      meta:bi(new Date(i.created_at).toLocaleString(),new Date(i.created_at).toLocaleString()),
      status:i.status==='processed'?'Processed':'Proposed'
    }));
    D.decisions = rows.decisions || [];
    D.memoryItems = rows.memory_items || [];
    D.liveStats = {
      students:D.students.length,
      sessions:D.sessions.length,
      lessons:(rows.lessons||[]).length,
      content:D.content.length,
      brain:D.brain.length,
      inboxNew:(rows.inbox_items||[]).filter(x=>x.status==='new').length,
      evidence:D.artifacts.length
    };

    state.mode='live';state.loadedAt=new Date().toISOString();state.error=null;setMemoryStatus('live');configureOperatingMode();
    if (D.students.length && !D.students.some(s=>s.id===selectedStudent)) selectedStudent=D.students[0].id;
    render();
  }

  async function fetchStudioData() {
    const r = await fetch('/api/studio-data', { credentials:'same-origin' });
    const data = await r.json().catch(()=>({}));
    return {r,data};
  }

  window.connectStudioMemory = async function(promptIfMissing=true) {
    try {
      let {r,data}=await fetchStudioData();
      if (r.status===401 && promptIfMissing) {
        if (!(await unlockFounderSession())) { state.mode='locked';setMemoryStatus('locked');return false; }
        ({r,data}=await fetchStudioData());
      }
      if (r.status===401) { state.mode='locked';state.error=null;setMemoryStatus('locked');return false; }
      if (!r.ok) throw new Error(data.error||`HTTP ${r.status}`);
      hydrate(data);return true;
    } catch (error) {
      state.mode='error';state.error=error.message;setMemoryStatus('error',error.message.slice(0,60));return false;
    }
  };

  window.disconnectStudioMemory = async function() {
    await fetch('/api/session',{method:'DELETE',credentials:'same-origin'}).catch(()=>null);
    state.mode='locked';state.error=null;setMemoryStatus('locked');location.reload();
  };

  window.openInboxComposer = function() {
    const modal=document.getElementById('modal');modal.classList.remove('hidden');
    modal.innerHTML=`<div class="modal-card glass"><div class="eyebrow">UNIVERSAL INBOX</div><h2>${langNow()==='zh'?'记录到公司记忆':'Capture to company memory'}</h2><p class="subtle">${langNow()==='zh'?'课堂观察、家长反馈、内容灵感、决定都可以先扔进这里。':'Drop class observations, parent feedback, content ideas or decisions here first.'}</p><textarea id="liveCaptureText" placeholder="${langNow()==='zh'?'课堂观察、想法、决策、待办……':'Class observation, idea, decision, task…'}"></textarea><div class="modal-actions"><button class="ghost" onclick="closeModal()">${langNow()==='zh'?'取消':'Cancel'}</button><button class="primary" onclick="submitLiveCapture()">${langNow()==='zh'?'保存到 Supabase':'Save to Supabase'}</button></div></div>`;
  };

  window.submitLiveCapture = async function() {
    const content=document.getElementById('liveCaptureText')?.value.trim();if(!content)return;
    if(!(await sessionStatus()) && !(await unlockFounderSession()))return;
    const r=await fetch('/api/studio-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'capture',payload:{input_type:'founder_note',content}})});
    const data=await r.json().catch(()=>({}));if(!r.ok){alert(data.error||`HTTP ${r.status}`);return;}closeModal();await connectStudioMemory(false);
  };

  window.studioAction = async function(action,payload={}) {
    if(!(await sessionStatus()) && !(await unlockFounderSession()))throw new Error('Founder session required.');
    const r=await fetch('/api/studio-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,payload})});
    const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||`HTTP ${r.status}`);await connectStudioMemory(false);return data;
  };

  const baseSetLanguage=window.setLanguage;
  if(baseSetLanguage){window.setLanguage=function(next){baseSetLanguage(next);setMemoryStatus(state.mode,state.error||'');configureOperatingMode();};}
  window.addEventListener('load',async()=>{setMemoryStatus('locked');configureOperatingMode();await connectStudioMemory(false);});
})();

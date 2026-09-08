(() => {
  const TOKEN_KEY = 'studio_access_token';
  const state = window.STUDIO_LIVE_STATE = { mode: 'demo', loadedAt: null, error: null };

  const langNow = () => (typeof lang !== 'undefined' ? lang : 'en');
  const bi = (en, zh) => ({ en, zh });

  function getToken(promptIfMissing = false) {
    let token = sessionStorage.getItem(TOKEN_KEY) || '';
    if (!token && promptIfMissing) {
      token = window.prompt(langNow() === 'zh'
        ? '请输入 Studio Access Token，以连接公司记忆（仅保存在当前浏览器会话）'
        : 'Enter your Studio Access Token to connect company memory (stored only for this browser session)') || '';
      if (token) sessionStorage.setItem(TOKEN_KEY, token);
    }
    return token;
  }

  function setMemoryStatus(mode, detail = '') {
    const el = document.getElementById('memoryStatus');
    if (!el) return;
    if (mode === 'live') el.textContent = langNow() === 'zh' ? 'Supabase 公司记忆在线' : 'Supabase company memory online';
    else if (mode === 'error') el.textContent = langNow() === 'zh' ? `记忆连接失败${detail ? ` · ${detail}` : ''}` : `Memory connection failed${detail ? ` · ${detail}` : ''}`;
    else el.textContent = langNow() === 'zh' ? '演示数据 · 点击连接记忆' : 'Demo data · click to connect memory';
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
    const skillsByStudent = new Map();
    for (const s of rows.student_skills || []) {
      if (!skillsByStudent.has(s.student_id)) skillsByStudent.set(s.student_id, {});
      skillsByStudent.get(s.student_id)[s.skill_name] = Number(s.score || 0);
    }

    D.students = (rows.students || []).map(s => ({
      id: s.slug,
      dbId: s.id,
      name: s.name,
      age: s.age,
      level: bi(s.current_level || '', s.current_level || ''),
      project: bi(s.current_project || '', s.current_project || ''),
      progress: Number(s.progress || 0),
      status: bi(s.status || 'active', s.status === 'active' ? '学习中' : (s.status || '')),
      skills: skillsByStudent.get(s.id) || {},
      lessons: (lessonsByStudent.get(s.id) || []).map(l => ({
        id: l.id,
        n: l.lesson_number || 0,
        title: bi(l.title || '', l.title || ''),
        date: l.lesson_date || '',
        achievement: bi(l.achievement || l.summary || '', l.achievement || l.summary || ''),
        difficulty: bi(l.difficulty || '', l.difficulty || ''),
        nextStep: bi(l.next_step || '', l.next_step || '')
      }))
    }));

    D.content = (rows.content_items || []).map(c => {
      const m = latestMetric(rows.content_metrics || [], c.id);
      const status = c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : 'Idea';
      return {
        id: c.id,
        title: bi(c.title || '', c.title || ''),
        pillar: bi(c.pillar || '', c.pillar || ''),
        status,
        views: m?.views ?? null,
        saves: m?.saves ?? null,
        leads: m?.leads ?? null,
        source: bi(c.source_label || c.source_type || '', c.source_label || c.source_type || '')
      };
    });

    D.brain = (rows.company_brain || []).filter(x => x.status !== 'archived').map(b => ({
      id: b.id,
      type: bi(b.brain_type || 'Insight', b.brain_type || '洞察'),
      title: bi(b.title || '', b.title || ''),
      body: bi(b.body || '', b.body || ''),
      evidence: Array.isArray(b.evidence) ? b.evidence.map(x => bi(String(x), String(x))) : []
    }));

    D.inbox = (rows.inbox_items || []).map(i => ({
      id: i.id,
      type: bi(i.input_type || 'Note', i.input_type || '记录'),
      title: bi(i.raw_content || '', i.raw_content || ''),
      meta: bi(new Date(i.created_at).toLocaleString(), new Date(i.created_at).toLocaleString()),
      status: i.status === 'processed' ? 'Processed' : 'Proposed'
    }));

    D.decisions = rows.decisions || [];
    D.memoryItems = rows.memory_items || [];
    state.mode = 'live';
    state.loadedAt = new Date().toISOString();
    state.error = null;
    setMemoryStatus('live');
    if (D.students.length && !D.students.some(s => s.id === selectedStudent)) selectedStudent = D.students[0].id;
    render();
  }

  window.connectStudioMemory = async function(promptIfMissing = true) {
    const token = getToken(promptIfMissing);
    if (!token) {
      setMemoryStatus('demo');
      return false;
    }
    try {
      const r = await fetch('/api/studio-data', { headers: { 'x-studio-access-token': token } });
      const data = await r.json().catch(() => ({}));
      if (r.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        throw new Error(langNow() === 'zh' ? 'Access Token 不正确' : 'Invalid access token');
      }
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      hydrate(data);
      return true;
    } catch (error) {
      state.mode = 'error';
      state.error = error.message;
      setMemoryStatus('error', error.message.slice(0, 60));
      return false;
    }
  };

  window.openInboxComposer = function() {
    const modal = document.getElementById('modal');
    modal.classList.remove('hidden');
    modal.innerHTML = `<div class="modal-card">
      <h2>${langNow() === 'zh' ? '记录到公司记忆' : 'Capture to company memory'}</h2>
      <p class="subtle">${langNow() === 'zh' ? '这条内容会直接写入 Supabase Inbox，之后我可以帮你分类成课程、决策、内容或长期记忆。' : 'This writes directly to the Supabase Inbox. It can later be classified into a lesson, decision, content item or long-term memory.'}</p>
      <textarea id="liveCaptureText" placeholder="${langNow() === 'zh' ? '课堂观察、想法、决策、待办……' : 'Class observation, idea, decision, task…'}"></textarea>
      <div class="modal-actions"><button class="ghost" onclick="closeModal()">${langNow() === 'zh' ? '取消' : 'Cancel'}</button><button class="primary" onclick="submitLiveCapture()">${langNow() === 'zh' ? '保存到 Supabase' : 'Save to Supabase'}</button></div>
    </div>`;
  };

  window.submitLiveCapture = async function() {
    const text = document.getElementById('liveCaptureText')?.value.trim();
    if (!text) return;
    const token = getToken(true);
    if (!token) return;
    const r = await fetch('/api/studio-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-studio-access-token': token },
      body: JSON.stringify({ action: 'capture', payload: { input_type: 'founder_note', content: text } })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      alert(data.error || `HTTP ${r.status}`);
      return;
    }
    closeModal();
    await connectStudioMemory(false);
  };

  const baseSetLanguage = window.setLanguage;
  if (baseSetLanguage) {
    window.setLanguage = function(next) {
      baseSetLanguage(next);
      setMemoryStatus(state.mode, state.error || '');
    };
  }

  window.addEventListener('load', () => {
    setMemoryStatus('demo');
    if (sessionStorage.getItem(TOKEN_KEY)) connectStudioMemory(false);
  });
})();

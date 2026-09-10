(() => {
  const TOKEN_KEY = 'studio_access_token';

  function getStudioToken() {
    let token = sessionStorage.getItem(TOKEN_KEY) || '';
    if (!token) {
      token = window.prompt(lang === 'zh'
        ? '请输入你的 Studio Access Token（只保存在当前浏览器会话中）'
        : 'Enter your Studio Access Token (stored only for this browser session)') || '';
      if (token) sessionStorage.setItem(TOKEN_KEY, token);
    }
    return token;
  }

  function gatewayStatusLive() {
    document.querySelectorAll('.chat-status .pill').forEach(el => {
      el.textContent = lang === 'zh' ? 'AI Gateway · 已连接' : 'AI Gateway · Live';
      el.classList.remove('orange');
      el.classList.add('green');
    });
  }

  const observer = new MutationObserver(gatewayStatusLive);
  observer.observe(document.documentElement, { subtree: true, childList: true });
  gatewayStatusLive();

  async function runPostClassHandoff(id, text, token) {
    if (id !== 'education') return;
    try {
      const response = await fetch('/api/process-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-studio-access-token': token },
        body: JSON.stringify({ raw_note: text })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.triggered) return;

      const parts = [];
      if (data.lessons?.length) parts.push(`${data.lessons.length} ${lang === 'zh' ? '条课程记录' : 'lesson record(s)'}`);
      if (data.student_skills?.length) parts.push(`${data.student_skills.length} ${lang === 'zh' ? '个成长信号' : 'skill signal(s)'}`);
      if (data.parent_updates?.length) parts.push(`${data.parent_updates.length} ${lang === 'zh' ? '份家长反馈草稿' : 'parent draft(s)'}`);
      if (data.content_item) parts.push(lang === 'zh' ? `小红书草稿《${data.content_title || '未命名'}》` : `Rednote draft “${data.content_title || 'Untitled'}”`);

      const current = getManagerThread(id);
      current.push({
        role: 'assistant',
        text: lang === 'zh'
          ? `🔄 Education Manager → Content Growth Manager\n课后联动已完成：${parts.join(' · ') || '已完成课程复盘写回'}${data.publishable ? '' : '\n这节课暂未生成内容草稿：故事强度不足时不会为了填内容而硬写。'}`
          : `🔄 Education Manager → Content Growth Manager\nPost-class handoff complete: ${parts.join(' · ') || 'lesson writeback completed'}${data.publishable ? '' : '\nNo content draft was created because the story signal was not strong enough.'}`,
        model: 'Studio Workflow',
        at: Date.now()
      });
      saveManagerThread(id, current);
      render();
      setTimeout(scrollManagerChat, 0);

      if (typeof window.refreshStudioData === 'function') window.refreshStudioData().catch(() => null);
    } catch (error) {
      console.warn('Post-class handoff failed', error);
    }
  }

  window.sendManagerMessage = async function(id) {
    const input = document.getElementById('managerInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const model = getManagerModel(id);
    const msgs = getManagerThread(id);
    msgs.push({ role: 'user', text, model, at: Date.now() });
    saveManagerThread(id, msgs);
    input.value = '';
    render();
    setTimeout(scrollManagerChat, 0);

    const token = getStudioToken();
    if (!token) {
      const current = getManagerThread(id);
      current.push({
        role: 'assistant',
        text: lang === 'zh' ? '没有输入 Studio Access Token，所以这次没有调用 AI。' : 'No Studio Access Token was provided, so the AI call was not sent.',
        model: 'Studio',
        at: Date.now()
      });
      saveManagerThread(id, current);
      render();
      return;
    }

    try {
      const payloadMessages = getManagerThread(id)
        .filter(m => !String(m.text || '').includes('真正调用') && !String(m.text || '').includes('secure backend'))
        .slice(-20)
        .map(m => ({ role: m.role, text: m.text }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-studio-access-token': token
        },
        body: JSON.stringify({
          managerId: id,
          model,
          messages: payloadMessages,
          locale: lang
        })
      });

      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        throw new Error(lang === 'zh' ? 'Studio Access Token 不正确，请重新发送消息后输入正确 Token。' : 'Invalid Studio Access Token. Send again and enter the correct token.');
      }
      if (!response.ok) throw new Error(data.error || `AI Gateway error (${response.status})`);

      const current = getManagerThread(id);
      current.push({
        role: 'assistant',
        text: data.text,
        model: data.model || model,
        provider: data.provider,
        context: data.context,
        at: Date.now()
      });
      saveManagerThread(id, current);
      render();
      setTimeout(scrollManagerChat, 0);

      runPostClassHandoff(id, text, token);
    } catch (error) {
      const current = getManagerThread(id);
      current.push({
        role: 'assistant',
        text: `${lang === 'zh' ? '连接 AI Gateway 失败' : 'AI Gateway failed'}: ${error.message}`,
        model: 'Studio',
        at: Date.now()
      });
      saveManagerThread(id, current);
      render();
      setTimeout(scrollManagerChat, 0);
    }
  };

  window.resetStudioAccessToken = function() {
    sessionStorage.removeItem(TOKEN_KEY);
  };
})();

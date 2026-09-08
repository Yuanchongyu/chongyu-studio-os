const STUDIO_MANAGERS = {
  chief: {
    icon:'⌁', name:{en:'Chief of Staff',zh:'Chief of Staff'},
    role:{en:'Cross-company priorities, weekly review and decision proposals.',zh:'跨公司优先级、每周经营复盘与决策建议。'}, preferred:'GPT',
    memory:[{en:'Company Brain',zh:'公司大脑'},{en:'Students & lesson activity',zh:'学生与课程动态'},{en:'Content pipeline',zh:'内容管线'},{en:'Active decisions',zh:'当前决策'}],
    skills:['weekly_review','save_decision','delegate_work'],
    actions:[{en:'Give me this week’s top 3 priorities',zh:'给我这周最重要的 3 个优先级'},{en:'What should I stop doing?',zh:'我现在最应该停止做什么？'},{en:'Turn today’s notes into decisions',zh:'把今天的记录整理成公司决策'}]
  },
  education: {
    icon:'◫', name:{en:'Education Manager',zh:'教育经理'},
    role:{en:'Student progress, curriculum, lesson design and learning evidence.',zh:'学生成长、课程体系、备课和学习证据。'}, preferred:'GPT',
    memory:[{en:'Teaching philosophy',zh:'教学理念'},{en:'Student profiles',zh:'学生档案'},{en:'Recent lessons',zh:'最近课程'},{en:'Skill maps',zh:'能力地图'},{en:'Curriculum decisions',zh:'课程决策'}],
    skills:['prepare_lesson','process_lesson','generate_parent_update'],
    actions:[{en:'What should Kevin learn next?',zh:'Kevin 下一节课应该学什么？'},{en:'Prepare Leo’s next lesson',zh:'帮 Leo 备下一节课'},{en:'Draft a parent update from Amy’s recent lessons',zh:'根据 Amy 最近课程生成家长反馈'}]
  },
  content: {
    icon:'✦', name:{en:'Content Manager',zh:'内容经理'},
    role:{en:'Turns real teaching artifacts into Xiaohongshu-ready content.',zh:'把真实教学成果转化为可以发布的小红书内容。'}, preferred:'GPT',
    memory:[{en:'Brand voice',zh:'品牌语气'},{en:'Published content',zh:'已发布内容'},{en:'Student story sources',zh:'学生故事来源'},{en:'Content insights',zh:'内容洞察'}],
    skills:['write_xiaohongshu','repurpose_lesson','content_review'],
    actions:[{en:'Turn Kevin Lesson 08 into a Xiaohongshu post',zh:'把 Kevin 第 08 课写成小红书'},{en:'Find the strongest story in recent lessons',zh:'从最近课程里找最值得写的故事'},{en:'Give me 5 hooks from real classroom evidence',zh:'基于真实课堂证据给我 5 个标题钩子'}]
  },
  coding: {
    icon:'⌘', name:{en:'Coding Partner',zh:'编程搭档'},
    role:{en:'Builds demos, student projects and the Studio OS itself.',zh:'构建 Demo、学生项目以及 Studio OS 本身。'}, preferred:'Claude',
    memory:[{en:'Product Brain',zh:'产品大脑'},{en:'Architecture decisions',zh:'架构决策'},{en:'Studio skills',zh:'Studio Skills'},{en:'GitHub source of truth',zh:'GitHub 唯一代码源'}],
    skills:['build_feature','review_code','save_adr'],
    actions:[{en:'Plan the next Studio OS engineering milestone',zh:'规划 Studio OS 下一阶段开发'},{en:'Review the current architecture',zh:'检查当前架构'},{en:'Turn a product decision into an ADR',zh:'把产品决策写成 ADR'}]
  }
};

let activeManagerId = null;
const mw = (en,zh) => lang === 'zh' ? zh : en;
const mwTx = v => v[lang] || v.en || v.zh;
const mwEsc = s => String(s ?? '').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const threadKey = id => `studio_manager_thread_${id}`;
const modelKey = id => `studio_manager_model_${id}`;
const getManagerModel = id => localStorage.getItem(modelKey(id)) || STUDIO_MANAGERS[id].preferred;
const getManagerThread = id => { try { return JSON.parse(localStorage.getItem(threadKey(id)) || '[]'); } catch { return []; } };
const saveManagerThread = (id,msgs) => localStorage.setItem(threadKey(id),JSON.stringify(msgs));

window.managers = function(){
  if(activeManagerId) return renderManagerWorkspace(activeManagerId);
  return `<div class="hero-line">${mw('Your AI leadership team','你的 AI 管理团队')}</div>
    <p class="hero-sub">${mw('Each manager has a persistent workspace, role-specific memory, model selection and shared company context.','每个经理都有独立长期工作区、角色记忆、模型选择，并共享同一份公司上下文。')}</p>
    <div class="manager-grid">${Object.entries(STUDIO_MANAGERS).map(([id,m])=>`
      <div class="manager-card" onclick="openManagerWorkspace('${id}')">
        <div class="manager-card-top"><div class="manager-icon">${m.icon}</div><span class="sync-pill"><i></i>${mw('Synced','已同步')}</span></div>
        <h3>${mwTx(m.name)}</h3><p>${mwTx(m.role)}</p>
        <div class="manager-meta"><span>${mw('Preferred model','默认模型')}</span><strong>${getManagerModel(id)}</strong></div>
        <div class="manager-meta"><span>${mw('Shared memory','共享记忆')}</span><strong>${m.memory.length} ${mw('sources','个来源')}</strong></div>
        <button class="primary manager-open">${mw('Open workspace','进入工作区')} →</button>
      </div>`).join('')}</div>
    <div class="shared-state-card"><div><span class="eyebrow">SHARED STATE</span><h3>${mw('Managers do not share raw chat history. They share approved company state.','经理不共享原始聊天记录，而是共享经过确认的公司状态。')}</h3></div><div class="memory-stack"><span>Company Brain</span><span>Students</span><span>Lessons</span><span>Decisions</span><span>Content</span></div></div>`;
};

window.openManagerWorkspace = function(id){
  activeManagerId = id;
  current = 'managers';
  localStorage.setItem(threadKey(id),localStorage.getItem(threadKey(id)) || '[]');
  document.getElementById('pageTitle').innerText = mwTx(STUDIO_MANAGERS[id].name);
  document.getElementById('workspaceLabel').innerText = mw('Manager workspace','经理工作区');
  renderNav(); render();
  setTimeout(scrollManagerChat,0);
};

window.closeManagerWorkspace = function(){
  activeManagerId = null;
  document.getElementById('pageTitle').innerText = t('page_managers');
  document.getElementById('workspaceLabel').innerText = t('founder');
  render();
};

function renderManagerWorkspace(id){
  const m = STUDIO_MANAGERS[id];
  const msgs = getManagerThread(id);
  const model = getManagerModel(id);
  return `<button class="text-btn" onclick="closeManagerWorkspace()">${mw('← All managers','← 返回经理团队')}</button>
    <div class="manager-workspace-head">
      <div class="row"><div class="manager-icon big-icon">${m.icon}</div><div><div class="eyebrow">AI MANAGER</div><h2 class="flush">${mwTx(m.name)}</h2><p class="subtle workspace-role">${mwTx(m.role)}</p></div></div>
      <div class="workspace-controls"><span class="sync-pill"><i></i>${mw('Memory synced','记忆已同步')}</span>
        <label>${mw('Model','模型')} <select onchange="setWorkspaceModel('${id}',this.value)"><option ${model==='Auto'?'selected':''}>Auto</option><option ${model==='GPT'?'selected':''}>GPT</option><option ${model==='Claude'?'selected':''}>Claude</option></select></label>
        <button class="ghost" onclick="clearManagerThread('${id}')">${mw('New thread','新建对话')}</button></div>
    </div>
    <div class="workspace-layout">
      <div class="chat-card">
        <div class="chat-status"><div><strong>${mwTx(m.name)}</strong><span>${mw('Thread is persisted in this browser','当前对话会保存在这个浏览器里')}</span></div><span class="pill orange">${mw('AI Gateway next','AI 网关待接入')}</span></div>
        <div id="managerChat" class="manager-chat">${msgs.length ? msgs.map(renderManagerMessage).join('') : `<div class="chat-empty"><div class="manager-icon">${m.icon}</div><strong>${mw('Start a conversation with this manager.','开始和这个经理对话。')}</strong><p>${mw('Manager workspace, context assembly, model switching and thread memory are live. Real GPT/Claude responses are the next backend integration.','经理工作区、Context 组装、模型切换和对话记忆已经可以使用。下一步接入后端后，这里就会返回真正的 GPT / Claude 回复。')}</p></div>`}</div>
        <div class="manager-composer"><textarea id="managerInput" placeholder="${mw('Message this manager…','和这个经理聊点什么…')}" onkeydown="managerComposerKeydown(event,'${id}')"></textarea><button class="primary" onclick="sendManagerMessage('${id}')">${mw('Send','发送')}</button></div>
      </div>
      <aside class="context-panel">
        <div class="context-section"><div class="context-title">${mw('CONTEXT USED','本次上下文')} <span>${m.memory.length}</span></div>${m.memory.map((x,i)=>`<div class="context-source"><i>${i+1}</i><span>${mwTx(x)}</span><b>✓</b></div>`).join('')}</div>
        <div class="context-section"><div class="context-title">SKILLS</div><div class="skill-chips">${m.skills.map(s=>`<code>${s}</code>`).join('')}</div></div>
        <div class="context-section"><div class="context-title">${mw('MEMORY LAYERS','记忆层')}</div><div class="memory-layers"><div><strong>01</strong><span>${mw('Company memory','公司记忆')}</span></div><div><strong>02</strong><span>${mw('Manager memory','经理记忆')}</span></div><div><strong>03</strong><span>${mw('Current thread','当前对话')}</span></div></div></div>
        <div class="context-section"><div class="context-title">${mw('SUGGESTED ACTIONS','建议操作')}</div><div class="action-stack">${m.actions.map((a,i)=>`<button onclick="quickManagerAction('${id}',${i})">${mwEsc(mwTx(a))}</button>`).join('')}</div></div>
      </aside>
    </div>`;
}

function renderManagerMessage(msg){
  return `<div class="chat-message ${msg.role}"><div class="message-role">${msg.role==='user'?mw('You','你'):mwTx(STUDIO_MANAGERS[activeManagerId].name)}</div><div class="message-bubble">${mwEsc(msg.text).replace(/\n/g,'<br>')}</div>${msg.model?`<div class="message-meta">${msg.model}</div>`:''}</div>`;
}

window.setWorkspaceModel = function(id,value){
  localStorage.setItem(modelKey(id),value);
  const globalModel = document.getElementById('modelSelect');
  if(globalModel) globalModel.value = value;
};

window.managerComposerKeydown = function(event,id){
  if(event.key==='Enter' && !event.shiftKey){ event.preventDefault(); sendManagerMessage(id); }
};

window.quickManagerAction = function(id,index){
  const input = document.getElementById('managerInput');
  input.value = mwTx(STUDIO_MANAGERS[id].actions[index]);
  sendManagerMessage(id);
};

window.sendManagerMessage = function(id){
  const input = document.getElementById('managerInput');
  if(!input) return;
  const text = input.value.trim();
  if(!text) return;
  const model = getManagerModel(id);
  const msgs = getManagerThread(id);
  msgs.push({role:'user',text,model,at:Date.now()});
  saveManagerThread(id,msgs);
  input.value='';
  render();
  setTimeout(()=>{
    const currentMsgs = getManagerThread(id);
    currentMsgs.push({role:'assistant',text:buildWorkspacePlaceholder(id,text,model),model,at:Date.now()});
    saveManagerThread(id,currentMsgs);
    render();
    setTimeout(scrollManagerChat,0);
  },300);
};

function buildWorkspacePlaceholder(id,text,model){
  const m = STUDIO_MANAGERS[id];
  if(lang==='zh') return `已选择 ${model}，并为这条请求加载 ${m.memory.length} 个上下文来源。\n\n你的请求：${text}\n\n当前这一版已经完成经理独立工作区、模型切换、共享 Context 和长期对话保存。真正调用 ${model} 的安全后端还没有接入，因此这里暂时显示这条状态回复。\n\n下一阶段接入 AI Gateway 后，同一个输入框会直接返回真实模型回答，并支持把决策、课程、内容等结构化写回 Studio Memory。`;
  return `${model} selected with ${m.memory.length} context sources loaded.\n\nYour request: ${text}\n\nThis version already has persistent manager workspaces, model switching, shared context and browser thread memory. The secure backend that calls ${model} is not connected yet, so this is a status response.\n\nOnce the AI Gateway is wired, this same composer will return the real model answer and write structured decisions, lessons and content back to Studio Memory.`;
}

window.clearManagerThread = function(id){
  localStorage.setItem(threadKey(id),'[]');
  render();
};

function scrollManagerChat(){ const el=document.getElementById('managerChat'); if(el) el.scrollTop=el.scrollHeight; }

const studioBaseAsk = window.askStudio;
window.askStudio = function(){
  if(current==='managers' && activeManagerId){
    const globalInput=document.getElementById('aiInput');
    const managerInput=document.getElementById('managerInput');
    if(globalInput && managerInput && globalInput.value.trim()){
      managerInput.value=globalInput.value;
      globalInput.value='';
      sendManagerMessage(activeManagerId);
      return;
    }
  }
  return studioBaseAsk();
};

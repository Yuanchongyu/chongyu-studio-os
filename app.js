const D = window.STUDIO_DATA;
let current = 'command';
let selectedStudent = 'marcos';
let lang = localStorage.getItem('studio_lang') || 'zh';

const I18N = {
  en: {
    founder:'Founder Control Deck', command:'Command Center', students:'Students', sessions:'Course Sessions', inbox:'Inbox', content:'Content Studio', brain:'Company Brain', workflows:'AI Workflows', parent:'Parent Share',
    page_command:'Command Center', page_students:'Student Intelligence', page_sessions:'Course Sessions', page_inbox:'Universal Inbox', page_content:'Content Studio', page_brain:'Company Brain', page_workflows:'Operating Modes', page_parent:'Parent Share',
    capture:'+ Capture', activeStudents:'Active students', sessionsImported:'Real sessions imported', publishedStories:'Published stories', memoryAssets:'Memory assets',
    hero:'Learning evidence, not just lesson notes.', heroSub:'One shared system turns every class into student growth, parent visibility, reusable curriculum and publishable stories.',
    latestJourney:'Latest learning journey', openStudent:'Open student', currentProject:'Current project', learningStage:'Learning stage', noAge:'Age not set',
    studentTimeline:'Student timeline', mappingPending:'Per-student lesson mapping is pending. The real class sessions are already stored and ready to link.',
    skillMap:'Growth signals', evidenceBacked:'Evidence-backed, not test-score based', sessionArchive:'Real course archive', source:'Source', concepts:'Concepts', highlights:'Highlights', teacherReflection:'Teacher reflection',
    mediaEvidence:'Media evidence', sourceMedia:'Source media', openRednote:'Open Rednote source', contentPipeline:'Published content', companyMemory:'Reusable company memory',
    parentIntro:'Private parent portals turn learning progress into something families can actually see.', portalInactive:'Not shared yet', portalActive:'Live', generateAccess:'Generate link + code', disableAccess:'Disable access',
    workflowHero:'One AI operator. Multiple operating modes.', workflowSub:'You keep talking to ChatGPT. These modes simply decide what context, data and SOPs should be used.',
    weeklyReview:'Weekly Executive Review', educationReview:'Education Review', contentReview:'Content Mining', parentUpdate:'Parent Update', memoryCurator:'Memory Curator',
    inboxEmpty:'Nothing waiting in the Inbox.', memoryOnline:'Company memory online', noStudentSessions:'No student-specific session links yet.', lessons:'Lessons', evidence:'Evidence',
    statusPublished:'Published', statusReady:'Ready', statusDraft:'Draft', statusIdea:'Idea', statusProcessed:'Processed', statusProposed:'Proposed'
  },
  zh: {
    founder:'创始人控制台', command:'指挥中心', students:'学生', sessions:'真实课程', inbox:'收件箱', content:'内容工作室', brain:'公司大脑', workflows:'AI 工作流', parent:'家长分享',
    page_command:'指挥中心', page_students:'学生成长档案', page_sessions:'真实课程记录', page_inbox:'统一收件箱', page_content:'内容工作室', page_brain:'公司大脑', page_workflows:'AI 工作模式', page_parent:'家长分享',
    capture:'+ 记录', activeStudents:'活跃学生', sessionsImported:'已导入真实课程', publishedStories:'已发布故事', memoryAssets:'公司记忆资产',
    hero:'不只是课程记录，而是可追踪的成长证据。', heroSub:'每一节课同时沉淀成学生成长、家长可见进度、可复用课程资产和真实内容素材。',
    latestJourney:'最新学习路径', openStudent:'查看学生', currentProject:'当前项目', learningStage:'学习阶段', noAge:'年龄待补',
    studentTimeline:'个人成长时间线', mappingPending:'学生与每节课的精确分支还需要补一次映射；四节真实课程已经完整入库，随时可以关联。',
    skillMap:'成长信号', evidenceBacked:'来自真实项目证据，而不是考试分数', sessionArchive:'真实课程档案', source:'来源', concepts:'关键概念', highlights:'课堂亮点', teacherReflection:'老师手记',
    mediaEvidence:'影像证据', sourceMedia:'课程素材', openRednote:'打开小红书原帖', contentPipeline:'已发布内容', companyMemory:'可复用公司记忆',
    parentIntro:'给每个孩子一个私密成长主页，让家长能持续看到课程、项目、作品和老师反馈。', portalInactive:'尚未分享', portalActive:'已开启', generateAccess:'生成链接 + 密码', disableAccess:'关闭访问',
    workflowHero:'一个 AI 操作员，多种工作模式。', workflowSub:'你继续直接和 ChatGPT 聊。这里的“经理”不再是独立聊天，而是决定该读取什么数据、调用什么 SOP。',
    weeklyReview:'每周经营复盘', educationReview:'教育经理 Review', contentReview:'内容挖掘', parentUpdate:'家长反馈', memoryCurator:'记忆整理',
    inboxEmpty:'收件箱目前没有待处理内容。', memoryOnline:'公司记忆在线', noStudentSessions:'还没有绑定到这个孩子的个人课程记录。', lessons:'课程', evidence:'证据',
    statusPublished:'已发布', statusReady:'待发布', statusDraft:'草稿', statusIdea:'灵感', statusProcessed:'已处理', statusProposed:'待处理'
  }
};

const t = key => I18N[lang][key] || I18N.en[key] || key;
const tx = value => typeof value === 'object' && value && ('en' in value || 'zh' in value) ? (value[lang] || value.en || value.zh || '') : (value ?? '');
const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const pills = (items=[]) => items.slice(0,8).map(x=>`<span class="chip">${esc(x)}</span>`).join('');
const statusText = s => t(`status${s}`) || s;

function navGroups() {
  return [
    ['STUDIO', [
      ['command','◈',t('command')], ['students','◉',t('students')], ['sessions','⌁',t('sessions')], ['inbox','◎',t('inbox')], ['content','✦',t('content')], ['brain','◇',t('brain')]
    ]],
    ['OPERATIONS', [
      ['workflows','⚡',t('workflows')], ['parent','↗',t('parent')]
    ]]
  ];
}

function setLanguage(next) {
  lang = next; localStorage.setItem('studio_lang', lang); document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  refreshChrome(); renderNav(); render();
}

function refreshChrome() {
  const workspace = document.getElementById('workspaceLabel'); if (workspace) workspace.textContent = t('founder');
  const title = document.getElementById('pageTitle'); if (title) title.textContent = t(`page_${current}`);
  const capture = document.getElementById('captureBtn'); if (capture) capture.textContent = t('capture');
  const en = document.getElementById('langEn'); if (en) en.classList.toggle('active', lang === 'en');
  const zh = document.getElementById('langZh'); if (zh) zh.classList.toggle('active', lang === 'zh');
}

function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = navGroups().map(([label,items]) => `<div class="nav-section">${label}</div>${items.map(i=>`<button class="nav-item ${current===i[0]?'active':''}" onclick="go('${i[0]}')"><span class="nav-icon">${i[1]}</span><span>${i[2]}</span></button>`).join('')}`).join('');
}

function go(page) { current = page; refreshChrome(); renderNav(); render(); }
function closeModal() { document.getElementById('modal')?.classList.add('hidden'); }

function metric(label,value,meta,icon) {
  return `<div class="metric-card glass"><div class="metric-icon">${icon}</div><div><div class="metric-label">${label}</div><div class="metric">${value}</div><div class="delta">${meta}</div></div></div>`;
}

function digitalAvatar(student, large=false) {
  const initials = esc((student?.name || '?').slice(0,2).toUpperCase());
  return `<div class="digital-avatar ${large?'large':''}"><div class="avatar-ring"></div><div class="avatar-core">${initials}</div><div class="avatar-node n1"></div><div class="avatar-node n2"></div></div>`;
}

function commandPage() {
  const stats = D.liveStats || { students:D.students?.length||0, sessions:D.sessions?.length||0, content:D.content?.length||0, brain:D.brain?.length||0 };
  const latest = (D.sessions || []).slice(-3).reverse();
  return `<section class="hero-panel glass">
    <div><div class="eyebrow cyan">CHONGYU STUDIO · LIVE MEMORY</div><h2>${t('hero')}</h2><p>${t('heroSub')}</p></div>
    <div class="orbital-mark"><span></span><i></i><b></b></div>
  </section>
  <div class="grid grid-4 metrics-row">
    ${metric(t('activeStudents'),stats.students,lang==='zh'?'Marcos · Mason':'Marcos · Mason','◉')}
    ${metric(t('sessionsImported'),stats.sessions,lang==='zh'?'来自真实课堂记录':'From real class records','⌁')}
    ${metric(t('publishedStories'),stats.content,lang==='zh'?'小红书真实内容':'Real Rednote stories','✦')}
    ${metric(t('memoryAssets'),stats.brain,lang==='zh'?'可被 ChatGPT 直接检索':'Directly retrievable by ChatGPT','◇')}
  </div>
  <div class="section-title"><div><div class="eyebrow">STUDENT SIGNAL</div><h3>${t('latestJourney')}</h3></div><span>${t('memoryOnline')}</span></div>
  <div class="grid grid-2">${(D.students||[]).map(studentCard).join('')}</div>
  <div class="section-title"><div><div class="eyebrow">COURSE ARCHIVE</div><h3>${t('sessionArchive')}</h3></div><button class="text-btn" onclick="go('sessions')">${lang==='zh'?'查看全部 →':'View all →'}</button></div>
  <div class="session-strip">${latest.map(sessionMini).join('')}</div>`;
}

function studentCard(s) {
  const count = (s.sessions?.length || 0) + (s.lessons?.length || 0);
  return `<article class="student-card glass" onclick="selectedStudent='${esc(s.id)}';go('students')">
    <div class="student-card-top">${digitalAvatar(s)}<div class="grow"><div class="eyebrow">LEARNING PROFILE</div><h3>${esc(s.name)}</h3><p>${esc(tx(s.level))}</p></div><span class="signal-badge">LIVE</span></div>
    <div class="project-box"><span>${t('currentProject')}</span><strong>${esc(tx(s.project))}</strong></div>
    <div class="student-stats"><div><b>${count}</b><span>${t('lessons')}</span></div><div><b>${Object.keys(s.skills||{}).length}</b><span>${t('skillMap')}</span></div><div><b>${D.artifacts?.filter(a=>a.student_id===s.dbId).length||0}</b><span>${t('evidence')}</span></div></div>
  </article>`;
}

function sessionMini(s) {
  const type = s.media?.[0]?.type || 'session';
  return `<article class="session-mini glass"><div class="media-icon ${type}">${type==='video'?'▶':type==='image'?'▧':type==='hardware'?'⌁':'✦'}</div><div><div class="eyebrow">SESSION ${esc(s.n)}</div><strong>${esc(tx(s.title))}</strong><p>${esc(tx(s.summary)).slice(0,150)}${tx(s.summary).length>150?'…':''}</p></div></article>`;
}

function studentsPage() {
  const s = D.students?.find(x=>x.id===selectedStudent) || D.students?.[0];
  if (!s) return `<div class="empty">No active students.</div>`;
  const linked = [...(s.sessions||[]), ...(s.lessons||[])];
  return `<div class="student-layout">
    <aside class="student-selector glass">${D.students.map(x=>`<button class="student-select ${x.id===s.id?'active':''}" onclick="selectedStudent='${esc(x.id)}';render()">${digitalAvatar(x)}<span><strong>${esc(x.name)}</strong><small>${esc(tx(x.project))}</small></span></button>`).join('')}</aside>
    <section class="student-profile glass">
      <div class="profile-hero">${digitalAvatar(s,true)}<div class="grow"><div class="eyebrow cyan">STUDENT DIGITAL TWIN</div><h2>${esc(s.name)}</h2><p>${esc(tx(s.level))}</p><div class="hero-chips"><span class="chip">${s.age ? `${t('learningStage')} · ${s.age}` : t('noAge')}</span><span class="chip cyan">${esc(tx(s.project))}</span></div></div><button class="ghost" onclick="go('parent')">${lang==='zh'?'家长分享 ↗':'Parent share ↗'}</button></div>
      <div class="section-title compact"><div><div class="eyebrow">PROJECT</div><h3>${t('currentProject')}</h3></div></div><div class="project-console"><div class="console-line"><span>01</span><b>${esc(tx(s.project))}</b></div><div class="console-line"><span>02</span><b>${esc(tx(s.level))}</b></div><div class="console-line"><span>03</span><b>${linked.length} ${lang==='zh'?'条成长记录':'growth records'}</b></div></div>
      <div class="section-title compact"><div><div class="eyebrow">SIGNALS</div><h3>${t('skillMap')}</h3></div><span>${t('evidenceBacked')}</span></div>
      ${Object.keys(s.skills||{}).length ? `<div class="skill-grid">${Object.entries(s.skills).map(([k,v])=>`<div class="skill"><div class="skill-head"><span>${esc(k)}</span><strong>${v}/10</strong></div><div class="progress"><i style="width:${Math.min(100,v*10)}%"></i></div></div>`).join('')}</div>` : `<div class="signal-empty"><span>◌</span><div><strong>${lang==='zh'?'技能雷达等待真实证据':'Skill radar awaits evidence'}</strong><p>${lang==='zh'?'我们不会为了好看而编造分数；后续从每节课的真实行为证据更新。':'We will not invent scores for decoration; signals will be updated from real session evidence.'}</p></div></div>`}
      <div class="section-title compact"><div><div class="eyebrow">TIMELINE</div><h3>${t('studentTimeline')}</h3></div></div>
      ${linked.length ? `<div class="timeline">${linked.map(x=>`<div class="timeline-item"><span class="timeline-dot"></span><div class="eyebrow">SESSION ${esc(x.n||'')}</div><h4>${esc(tx(x.title))}</h4><p>${esc(tx(x.achievement||x.track||''))}</p>${tx(x.difficulty||'')?`<small>${t('challenge')||'Challenge'} · ${esc(tx(x.difficulty))}</small>`:''}</div>`).join('')}</div>` : `<div class="notice-card"><b>${lang==='zh'?'真实课程已入库，个人映射待确认':'Real sessions are imported; student mapping is pending'}</b><p>${t('mappingPending')}</p></div>`}
    </section>
  </div>`;
}

function sessionsPage() {
  return `<div class="page-intro"><div><div class="eyebrow cyan">REAL CLASSROOM DATA</div><h2>${t('sessionArchive')}</h2><p>${lang==='zh'?'这四节不是 demo，而是从你真实发布的课堂记录整理出来的课程资产。':'These are reconstructed from your real published classroom records, not demo data.'}</p></div></div>
  <div class="session-grid">${(D.sessions||[]).map(sessionCard).join('')}</div>`;
}

function sessionCard(s) {
  const media = s.media?.[0];
  return `<article class="session-card glass">
    <div class="session-visual ${media?.type||'session'}"><div class="session-number">0${esc(s.n)}</div><div class="visual-orbit"></div><div class="visual-icon">${media?.type==='video'?'▶':media?.type==='hardware'?'⌁':'✦'}</div><small>${esc(media?.label||'Project evidence')}</small></div>
    <div class="session-body"><div class="eyebrow">SESSION ${esc(s.n)} · ${esc(s.sourcePlatform||'')}</div><h3>${esc(tx(s.title))}</h3><p>${esc(tx(s.summary))}</p><div class="label-row"><span>${t('concepts')}</span>${pills(s.concepts)}</div><div class="highlight-list">${(s.highlights||[]).slice(0,4).map(x=>`<div><span>✓</span>${esc(x)}</div>`).join('')}</div><div class="reflection"><span>“</span><p>${esc(tx(s.reflection))}</p></div>${s.sourceUrl?`<a class="source-link" href="${esc(s.sourceUrl)}" target="_blank" rel="noopener">${t('openRednote')} ↗</a>`:''}</div>
  </article>`;
}

function contentPage() {
  const content = D.content || [];
  return `<div class="page-intro"><div><div class="eyebrow cyan">REAL STORIES</div><h2>${t('contentPipeline')}</h2><p>${lang==='zh'?'内容不再是孤立文案，而是和真实课程、学生成长、媒体证据绑定。':'Content stays connected to real sessions, student growth and evidence.'}</p></div></div>
  <div class="content-board">${content.map(c=>`<article class="content-card glass"><div class="row between"><span class="chip cyan">${esc(tx(c.pillar))}</span><span class="status-dot-text">${statusText(c.status)}</span></div><h3>${esc(tx(c.title))}</h3><p>${esc(tx(c.hook||c.body||''))}</p><div class="content-meta"><span>${t('source')}: ${esc(tx(c.source))}</span><span>${c.views==null?'—':c.views} views</span></div></article>`).join('')}</div>`;
}

function brainPage() {
  return `<div class="page-intro"><div><div class="eyebrow cyan">COMPANY MEMORY</div><h2>${t('companyMemory')}</h2><p>${lang==='zh'?'这里存“公司真正学到了什么”，不是把每段聊天原封不动塞进数据库。':'This stores what the company actually learned, not raw chat transcripts.'}</p></div></div>
  <div class="brain-grid">${(D.brain||[]).map(b=>`<article class="brain-card glass"><div class="eyebrow">${esc(tx(b.type))}</div><h3>${esc(tx(b.title))}</h3><p>${esc(tx(b.body))}</p>${b.evidence?.length?`<div class="evidence-row">${b.evidence.map(e=>`<span class="chip">${esc(tx(e))}</span>`).join('')}</div>`:''}</article>`).join('')}</div>`;
}

function inboxPage() {
  const items = D.inbox || [];
  return `<div class="page-intro"><div><div class="eyebrow cyan">UNIVERSAL INBOX</div><h2>${lang==='zh'?'低摩擦输入，高质量沉淀':'Low-friction capture, high-quality memory'}</h2><p>${lang==='zh'?'先记录，再由 ChatGPT 整理成课程、决策、内容或长期记忆。':'Capture first; ChatGPT can later structure it into lessons, decisions, content or durable memory.'}</p></div><button class="primary" onclick="openInboxComposer()">${t('capture')}</button></div>
  ${items.length?`<div class="inbox-list">${items.map(i=>`<article class="inbox-item glass"><div class="inbox-icon">◎</div><div><div class="eyebrow">${esc(tx(i.type))}</div><h4>${esc(tx(i.title)).slice(0,220)}</h4><small>${esc(tx(i.meta))}</small></div><span class="chip">${statusText(i.status)}</span></article>`).join('')}</div>`:`<div class="empty glass">${t('inboxEmpty')}</div>`}`;
}

function workflowsPage() {
  const modes = [
    ['◈',t('weeklyReview'),lang==='zh'?'扫描课程、内容、Inbox、决策，输出本周最值得推进的 3 件事。':'Scan lessons, content, inbox and decisions and return the top three priorities.'],
    ['◉',t('educationReview'),lang==='zh'?'读取单个学生的最近课程、项目证据和教学原则，决定下一步。':'Read one student’s recent work, evidence and teaching principles to decide what comes next.'],
    ['✦',t('contentReview'),lang==='zh'?'从真实课程里挖出值得发的小红书故事，而不是凭空造选题。':'Mine real lessons for stories worth publishing instead of inventing topics.'],
    ['↗',t('parentUpdate'),lang==='zh'?'把技术成果翻译成家长能看懂的成长变化。':'Translate technical outcomes into visible growth parents can understand.'],
    ['◇',t('memoryCurator'),lang==='zh'?'把长对话压缩成一条值得长期保存的决策、规律或学生观察。':'Compress long discussions into durable decisions, patterns or student observations.']
  ];
  return `<section class="hero-panel glass"><div><div class="eyebrow cyan">OPERATING MODES</div><h2>${t('workflowHero')}</h2><p>${t('workflowSub')}</p></div><div class="operator-badge">GPT<br><small>PRIMARY</small></div></section><div class="workflow-grid">${modes.map(m=>`<article class="workflow-card glass"><div class="workflow-icon">${m[0]}</div><h3>${m[1]}</h3><p>${m[2]}</p><div class="workflow-footer"><span>Shared Supabase context</span><span>→ ChatGPT</span></div></article>`).join('')}</div>`;
}

async function generateParentAccess(slug) {
  try {
    const result = await window.studioAction('generate_parent_access',{student_slug:slug});
    const base = location.origin;
    const modal = document.getElementById('modal'); modal.classList.remove('hidden');
    modal.innerHTML = `<div class="modal-card glass"><div class="eyebrow cyan">PARENT PORTAL</div><h2>${lang==='zh'?'家长访问已生成':'Parent access created'}</h2><div class="share-box"><label>Link</label><code>${esc(base+result.path)}</code><label>${lang==='zh'?'一次性显示的访问密码':'Access code shown once'}</label><code class="big-code">${esc(result.code)}</code></div><p class="subtle">${lang==='zh'?'请现在保存这串密码。数据库里只保存哈希，不保存明文。':'Save this code now. Only its hash is stored in the database.'}</p><div class="modal-actions"><button class="primary" onclick="closeModal()">OK</button></div></div>`;
  } catch (e) { alert(e.message); }
}

async function disableParentAccess(slug) {
  if (!confirm(lang==='zh'?'确定关闭这个家长链接吗？':'Disable this parent link?')) return;
  try { await window.studioAction('disable_parent_access',{student_slug:slug}); render(); } catch(e){ alert(e.message); }
}

function parentPage() {
  return `<div class="page-intro"><div><div class="eyebrow cyan">PRIVATE FAMILY VIEW</div><h2>${t('parent')}</h2><p>${t('parentIntro')}</p></div></div>
  <div class="grid grid-2">${(D.students||[]).map(s=>{const portal=(D.parentPortals||[]).find(p=>p.student_id===s.dbId);const live=portal?.is_active;return `<article class="parent-card glass"><div class="parent-preview"><div class="parent-stars"></div>${digitalAvatar(s,true)}<div><small>PRIVATE LEARNING JOURNEY</small><h3>${esc(s.name)}</h3><p>${esc(tx(s.project))}</p></div></div><div class="row between"><span class="chip ${live?'cyan':''}">${live?t('portalActive'):t('portalInactive')}</span><div class="row">${live?`<a class="mini-btn" href="/parent/${encodeURIComponent(s.id)}" target="_blank">Preview ↗</a><button class="mini-btn" onclick="disableParentAccess('${esc(s.id)}')">${t('disableAccess')}</button>`:`<button class="primary small" onclick="generateParentAccess('${esc(s.id)}')">${t('generateAccess')}</button>`}</div></div></article>`}).join('')}</div>
  <div class="notice-card"><b>${lang==='zh'?'先把课程映射补准，再正式发给家长':'Finish exact lesson mapping before sharing widely'}</b><p>${t('mappingPending')}</p></div>`;
}

function render() {
  const content = document.getElementById('content');
  const pages = { command:commandPage, students:studentsPage, sessions:sessionsPage, inbox:inboxPage, content:contentPage, brain:brainPage, workflows:workflowsPage, parent:parentPage };
  content.innerHTML = (pages[current] || commandPage)();
}

function askStudio() { go('workflows'); }

window.go=go;window.render=render;window.setLanguage=setLanguage;window.closeModal=closeModal;window.generateParentAccess=generateParentAccess;window.disableParentAccess=disableParentAccess;window.askStudio=askStudio;
refreshChrome();renderNav();render();

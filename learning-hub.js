(()=>{
  const isZh=()=>String(localStorage.getItem('studio_lang')||document.documentElement.lang||'zh').toLowerCase().startsWith('zh');
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const tx=v=>v&&typeof v==='object'&&('en'in v||'zh'in v)?(v[isZh()?'zh':'en']||v.en||v.zh||''):(v??'');
  let selectedStudent=localStorage.getItem('learning_hub_student')||'marcos';

  function page(){
    const active=(document.querySelector('.nav-item.active')?.textContent||'').trim();
    const title=(document.getElementById('pageTitle')?.textContent||'').trim();
    if(/学生管理|Student Management|学生成长档案|Student Intelligence/i.test(`${active} ${title}`))return 'students';
    if(/过往课程|Course History/i.test(`${active} ${title}`))return 'courses';
    return null;
  }
  function students(){return window.STUDIO_DATA?.students||[];}
  function student(){return students().find(s=>s.id===selectedStudent)||students()[0]||null;}
  function allRecords(s){return [...(s?.sessions||[]),...(s?.lessons||[])].sort((a,b)=>(b.n||0)-(a.n||0));}
  function latestRecord(s){return allRecords(s)[0]||null;}
  function normalizeText(v){return tx(v||'').replace(/\\n/g,' ').trim();}
  function short(v,n=180){const x=normalizeText(v);return x.length>n?x.slice(0,n)+'…':x;}
  function setRole(){const b=document.getElementById('modelBtn');if(b)b.textContent=isZh()?'ChatGPT · 教育经理':'ChatGPT · Education Manager';}
  function switcher(){return `<div class="student-switcher">${students().map(s=>`<button class="${s.id===selectedStudent?'active':''}" onclick="window.selectLearningStudent('${esc(s.id)}')">${esc(s.name)}</button>`).join('')}</div>`;}
  function skillRows(s){return (s.skills||[]).slice(0,6).map(k=>`<div class="skill-compact-row"><span>${esc(tx(k.name))}</span><div class="bar"><i style="width:${Math.min(100,Number(k.score||0)*10)}%"></i></div><strong>${Number(k.score||0)}/10</strong></div>`).join('')||`<div class="course-empty">${isZh()?'还没有足够证据形成能力信号':'Not enough evidence for skill signals yet'}</div>`;}
  function nextDirection(s){const r=latestRecord(s);return short(r?.nextStep||r?.difficulty||s?.project||'',145)|| (isZh()?'继续围绕当前项目推进一个可验证的新里程碑。':'Continue the current project toward one verifiable milestone.');}
  function growthSignal(s){const r=latestRecord(s);return short(r?.achievement||r?.track||r?.teacherNote||'',210)||(isZh()?'等待下一次课堂记录后生成新的成长信号。':'A new growth signal will appear after the next lesson record.');}
  function studentView(){
    const s=student();if(!s)return '';
    const records=allRecords(s),latest=records[0];
    return `<div class="learning-hub"><div class="learning-head"><div><div class="eyebrow cyan">STUDENT INTELLIGENCE</div><h2>${isZh()?'学生现在处于什么状态？':'Where is this student now?'}</h2><p>${isZh()?'这里只保留长期画像、当前方向和最新成长信号。逐节发生了什么，请去「过往课程」。':'This view keeps the durable profile, current direction and latest growth signals. Session-by-session history lives in Course History.'}</p></div>${switcher()}</div><section class="student-overview glass"><div class="student-identity"><div class="student-photo"><span>${esc((s.name||'?').slice(0,2).toUpperCase())}</span></div><div><div class="eyebrow">${isZh()?'学生档案':'LEARNING PROFILE'}</div><h2>${esc(s.name)}</h2><p>${esc(tx(s.level)||'')}</p></div><div class="student-actions"><button onclick="openStudentForm('${esc(s.dbId)}')">${isZh()?'编辑档案':'Edit profile'}</button><button onclick="go('parent')">${isZh()?'家长页 ↗':'Parent view ↗'}</button></div></div><div class="student-direction"><div class="student-signal"><label>${isZh()?'CURRENT DIRECTION · 当前方向':'CURRENT DIRECTION'}</label><strong>${esc(tx(s.project)||'—')}</strong><p>${esc(nextDirection(s))}</p></div><div class="student-signal"><label>${isZh()?'LATEST MILESTONE · 最近里程碑':'LATEST MILESTONE'}</label><strong>${latest?.n?(isZh()?`第 ${latest.n} 节`:`Session ${latest.n}`):'—'}</strong><p>${esc(short(latest?.title||'',90))}</p></div><div class="student-signal"><label>${isZh()?'EVIDENCE · 成长证据':'EVIDENCE'}</label><strong>${records.length} ${isZh()?'条课程记录':'lesson records'}</strong><p>${(s.skills||[]).length} ${isZh()?'个持续观察的能力信号':'tracked skill signals'}</p></div></div></section><div class="student-dashboard-grid"><section class="student-panel glass"><div class="eyebrow cyan">LATEST GROWTH SIGNAL</div><h3>${isZh()?'最近一次真正的变化':'What changed most recently'}</h3><div class="growth-callout"><strong>${esc(latest?.title?tx(latest.title):(isZh()?'等待课堂记录':'Waiting for a lesson record'))}</strong><p>${esc(growthSignal(s))}</p></div><div class="student-quick-meta"><div><span>${isZh()?'当前项目':'Project'}</span><strong>${esc(short(s.project,38)||'—')}</strong></div><div><span>${isZh()?'学习阶段':'Stage'}</span><strong>${esc(short(s.level,38)||'—')}</strong></div><div><span>${isZh()?'下一步':'Next'}</span><strong>${esc(short(nextDirection(s),42))}</strong></div></div></section><section class="student-panel glass"><div class="eyebrow cyan">GROWTH MAP</div><h3>${isZh()?'能力地图':'Skill signals'}</h3><div class="skill-compact">${skillRows(s)}</div></section></div></div>`;
  }

  function contentCount(s,r){
    const n=r?.n;const name=s?.name||'';return (window.STUDIO_DATA?.content||[]).filter(c=>{
      const src=String(tx(c.source)||'');const title=String(tx(c.title)||'');return new RegExp(name,'i').test(src+title)&&(n?new RegExp(`Lesson\\s*${n}|第\\s*${n}\\s*节`,'i').test(src+title):true);
    }).length;
  }
  function insight(label,text){return text?`<div class="course-insight"><span>${label}</span><p>${esc(short(text,180))}</p></div>`:'';}
  function courseCard(s,r){
    const achievement=r.achievement||r.track||r.teacherNote||'';const difficulty=r.difficulty||'';const next=r.nextStep||'';const count=contentCount(s,r);
    return `<article class="course-story glass"><div class="course-index">${r.n?(isZh()?`第 ${r.n} 节`:`S${r.n}`):'•'}</div><div><h3>${esc(tx(r.title)||'')}</h3><p class="summary">${esc(short(achievement||r.summary||'',260))}</p><div class="course-insights">${insight(isZh()?'课堂挑战':'CHALLENGE',difficulty)}${insight(isZh()?'下一步':'NEXT STEP',next)}</div><div class="content-signal"><span><b>${count?'✓':'✦'} ${isZh()?'内容信号':'CONTENT SIGNAL'}</b> · ${count?`${count} ${isZh()?'条内容已从这节课沉淀':'content item(s) linked'}`:(isZh()?'等待内容经理判断是否值得写':'ready for Content Manager review')}</span>${count?`<button class="text-btn" onclick="go('content')">${isZh()?'查看内容 →':'View content →'}</button>`:''}</div></div></article>`;
  }
  function journeySummary(s,rows){
    const latest=rows[0];const oldest=rows[rows.length-1];
    return `<section class="journey-summary glass"><div class="eyebrow cyan">LEARNING JOURNEY</div><h3>${esc(s.name)} · ${rows.length} ${isZh()?'节真实课堂':'recorded sessions'}</h3><p>${rows.length?`${isZh()?'从':'From'}「${esc(tx(oldest?.title)||'')}」${isZh()?'走到':' → '}「${esc(tx(latest?.title)||'')}」。${isZh()?'这里记录的是每节课真正发生的项目结果、难点和下一步，而不是重复学生简介。':'This timeline keeps concrete outcomes, challenges and next steps rather than repeating the student profile.'}`:(isZh()?'还没有课堂记录。':'No lesson history yet.')}</p><div class="journey-track"><span>${esc(tx(s.project)||'—')}</span><span>${(s.skills||[]).length} ${isZh()?'个能力信号':'skill signals'}</span><span>${rows.length} ${isZh()?'节课程':'sessions'}</span></div></section>`;
  }
  function courseView(){
    const s=student();if(!s)return '';
    const rows=allRecords(s);
    return `<div class="learning-hub"><div class="learning-head"><div><div class="eyebrow cyan">COURSE HISTORY</div><h2>${isZh()?'不是流水账，而是一条学习轨迹':'A learning journey, not a log dump'}</h2><p>${isZh()?'这里专门保存“这节课发生了什么”：项目结果、挑战、下一步，以及是否产生了可写成内容的真实故事。':'This page owns what actually happened: project outcomes, challenges, next steps, and whether a real classroom story became content.'}</p></div></div><div class="course-hub"><aside class="course-student-nav glass">${students().map(x=>`<button class="${x.id===selectedStudent?'active':''}" onclick="window.selectLearningStudent('${esc(x.id)}')"><span>${esc(x.name)}</span><small>${allRecords(x).length}</small></button>`).join('')}</aside><main><div class="student-switcher" style="margin-bottom:12px">${students().map(x=>`<button class="${x.id===selectedStudent?'active':''}" onclick="window.selectLearningStudent('${esc(x.id)}')">${esc(x.name)}</button>`).join('')}</div>${journeySummary(s,rows)}<div class="course-timeline">${rows.length?rows.map(r=>courseCard(s,r)).join(''):`<div class="course-empty glass">${isZh()?'这个学生还没有课程记录':'No course history for this student yet'}</div>`}</div></main></div></div>`;
  }

  function render(){
    const p=page();if(!p)return;const content=document.getElementById('content');if(!content)return;
    if(content.dataset.learningHubRendering==='1')return;
    if(!students().some(s=>s.id===selectedStudent))selectedStudent=students()[0]?.id||'';
    content.dataset.learningHubRendering='1';content.innerHTML=p==='students'?studentView():courseView();delete content.dataset.learningHubRendering;setRole();
  }
  window.selectLearningStudent=id=>{selectedStudent=id;localStorage.setItem('learning_hub_student',id);render();};
  window.refreshLearningHub=render;
  const obs=new MutationObserver(()=>{if(page()&&!document.querySelector('.learning-hub'))setTimeout(render,20);});
  window.addEventListener('load',()=>{const c=document.getElementById('content');if(c)obs.observe(c,{childList:true,subtree:false});setTimeout(render,520);});
})();
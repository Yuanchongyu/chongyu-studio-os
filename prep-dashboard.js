(()=>{
  const isZh=()=>String(localStorage.getItem('studio_lang')||document.documentElement.lang||'zh').toLowerCase().startsWith('zh');
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const tx=v=>v&&typeof v==='object'&&('en'in v||'zh'in v)?(v[isZh()?'zh':'en']||v.en||v.zh||''):(v??'');
  const studentById=id=>(window.STUDIO_DATA?.students||[]).find(s=>s.dbId===id);
  const now=()=>new Date();
  const fmtDay=v=>new Date(v).toLocaleDateString(isZh()?'zh-CN':'en-CA',{weekday:'short',month:'short',day:'numeric'});
  const fmtTime=v=>new Date(v).toLocaleTimeString(isZh()?'zh-CN':'en-CA',{hour:'2-digit',minute:'2-digit'});
  const slugNames=()=>Object.fromEntries((window.STUDIO_DATA?.students||[]).map(s=>[String(s.name||'').toLowerCase(),s]));
  let selectedKey=null;

  function onPrepPage(){
    const title=(document.getElementById('pageTitle')?.textContent||'').trim();
    const active=(document.querySelector('.nav-item.active')?.textContent||'').trim();
    return /备课|Lesson Prep/i.test(`${title} ${active}`);
  }

  function deckFor(names,title=''){
    const text=`${names.join(' ')} ${title}`;
    if(/Ryan|Spencer|人脸|Face/i.test(text)) return {href:'/decks/face-access.html',label:isZh()?'打开人脸识别课件':'Open face-access deck'};
    if(/Marcos|Mason|IMU|MotionAccess/i.test(text)) return {href:'/decks/imu-motionaccess.html',label:isZh()?'打开第7节 IMU 课件':'Open Session 7 IMU deck'};
    return null;
  }

  function lessonTemplate(names,title=''){
    const text=`${names.join(' ')} ${title}`;
    if(/Ryan|Spencer|人脸|Face/i.test(text)) return {
      what:isZh()?'亲手建立人脸 Dataset，训练第一个识别模型，再把它放进一个真实门禁系统。':'Build a face dataset, train a first recognition model, then place it inside a real access-control system.',
      why:isZh()?'把 Dataset / Training / Validation / Inference 从抽象术语变成亲手做过的过程，并理解“模型只是产品的一部分”。':'Turn Dataset / Training / Validation / Inference into a hands-on process and see that a model is only one part of a product.',
      outcome:isZh()?'完成两人的本地人脸数据集 + 第一个识别模型 + Webcam 推理测试，并画出门禁系统完整链路。':'Finish a local face dataset, first recognition model, webcam inference test, and the complete access-system flow.',
      flow:isZh()?['AI 基础回顾','拍照片建 Dataset','Train + Validation','Webcam Test','故意搞坏模型','设计 Access System']:['AI recap','Build dataset','Train + validate','Webcam test','Break the model','Design access system'],
      prepare:isZh()?['Laptop + Webcam','每人 10–15 张多角度照片','AI Agent / Python 环境']:['Laptop + Webcam','10–15 varied photos each','AI Agent / Python environment']
    };
    if(/Marcos|Mason|IMU|MotionAccess/i.test(text)) return {
      what:isZh()?'从 IMU 原始数据出发，自己采集、打标签、训练动作分类器，再把动作映射成电脑控制。':'Start from raw IMU data, collect and label examples, train a gesture classifier, then map gestures to computer controls.',
      why:isZh()?'把“传感器能读数”升级成“传感器 + 数据 + 模型 + 实时推理”的完整 Physical AI 闭环。':'Upgrade “the sensor gives numbers” into a complete Physical AI loop: sensor + data + model + real-time inference.',
      outcome:isZh()?'完成一份动作 Dataset、一个可运行的动作分类器，以及至少一个实时控制 Demo。':'Finish a gesture dataset, a working classifier, and at least one real-time control demo.',
      flow:isZh()?['连接 IMU','观察实时数据','采集 + Label','Train Model','实时 Inference','映射游戏控制']:['Connect IMU','Inspect live data','Collect + label','Train model','Live inference','Map game control'],
      prepare:isZh()?['XIAO nRF52840 / IMU','USB-C + Laptop','上一节 IMU Demo / 游戏']:['XIAO nRF52840 / IMU','USB-C + Laptop','Previous IMU demo / game']
    };
    return {
      what:isZh()?'明确本节要完成的项目结果。':'Define the concrete project outcome for this lesson.',
      why:isZh()?'让下一节课围绕一个清晰的学习目标推进。':'Keep the next lesson centered on a clear learning goal.',
      outcome:isZh()?'下课前完成一个可验证的项目里程碑。':'Finish one verifiable project milestone before class ends.',
      flow:isZh()?['回顾','目标','构建','测试','Debug','总结']:['Recap','Goal','Build','Test','Debug','Reflect'],
      prepare:isZh()?['Laptop','项目文件','所需硬件 / 素材']:['Laptop','Project files','Required hardware / assets']
    };
  }

  function studentNamesForEvent(e){
    const names=[];const map=slugNames();const title=String(e.title||'');
    Object.values(map).forEach(s=>{if(new RegExp(`\\b${String(s.name).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i').test(title))names.push(s.name)});
    const direct=studentById(e.student_id);if(direct&&!names.includes(direct.name))names.push(direct.name);
    if(/Marcos\s*&\s*Mason|Marcos\s*(and|\+)\s*Mason/i.test(title)){if(!names.includes('Marcos'))names.push('Marcos');if(!names.includes('Mason'))names.push('Mason');}
    if(/Ryan\s*&\s*Spencer|Ryan\s*(and|\+)\s*Spencer/i.test(title)){if(!names.includes('Ryan'))names.push('Ryan');if(!names.includes('Spencer'))names.push('Spencer');}
    return names;
  }

  function groupLessons(){
    const ext=window.STUDIO_EXT||{};const plans=(ext.lessonPlans||[]).filter(p=>p.status!=='archived'&&p.status!=='completed');
    const events=(ext.calendarEvents||[]).filter(e=>e.event_type==='lesson'&&new Date(e.start_at)>=new Date(now().getTime()-6*60*60*1000));
    const groups=[];const used=new Set();
    for(const e of events){
      const names=studentNamesForEvent(e);if(!names.length)continue;
      const matched=plans.filter(p=>{
        const s=studentById(p.student_id);return s&&names.includes(s.name)&&(!p.scheduled_for||Math.abs(new Date(p.scheduled_for)-new Date(e.start_at))<36*60*60*1000);
      });
      matched.forEach(p=>used.add(p.id));
      const title=matched[0]?.title||e.title||'';const deck=deckFor(names,title);const tpl=lessonTemplate(names,title);
      const hasPlan=matched.length>0;const readiness=Math.min(100,(hasPlan?45:0)+(deck?35:0)+20);
      groups.push({key:`event:${e.id}`,names,title,event:e,plans:matched,deck,tpl,readiness,status:hasPlan&&deck?'ready':'partial'});
    }
    const leftover=plans.filter(p=>!used.has(p.id));
    const bySig=new Map();
    leftover.forEach(p=>{
      const s=studentById(p.student_id);if(!s)return;const sig=`${p.title}|${p.scheduled_for||''}`;if(!bySig.has(sig))bySig.set(sig,[]);bySig.get(sig).push({p,s});
    });
    bySig.forEach(rows=>{
      const names=rows.map(x=>x.s.name);const p=rows[0].p;const deck=deckFor(names,p.title);const tpl=lessonTemplate(names,p.title);const readiness=Math.min(100,45+(deck?35:0)+(p.scheduled_for?20:0));
      groups.push({key:`plan:${p.id}`,names,title:p.title,event:null,plans:rows.map(x=>x.p),deck,tpl,readiness,status:readiness>=95?'ready':'partial',scheduled_for:p.scheduled_for||null});
    });
    groups.sort((a,b)=>new Date(a.event?.start_at||a.scheduled_for||'2999-01-01')-new Date(b.event?.start_at||b.scheduled_for||'2999-01-01'));
    return groups;
  }

  function readyLabel(g){
    if(g.readiness>=95)return isZh()?'● 已准备':'● Ready';
    return `● ${g.readiness}% ${isZh()?'准备度':'ready'}`;
  }
  function when(g){const v=g.event?.start_at||g.scheduled_for;if(!v)return isZh()?'未排期':'Unscheduled';return `${fmtDay(v)} · ${fmtTime(v)}`;}
  function sessionLabel(g){const n=g.plans?.[0]?.planned_session_number;return n?(isZh()?`第 ${n} 节`:`Session ${n}`):(isZh()?'下一节':'Next lesson');}
  function rawPlan(g){return (g.plans||[]).map(p=>p.prep_notes||'').filter(Boolean)[0]||'';}
  function checks(g){
    return [
      [true,isZh()?'课程主题已确定':'Topic defined'],
      [Boolean(g.deck),isZh()?'课件已准备':'Deck ready'],
      [Boolean(g.event?.start_at||g.scheduled_for),isZh()?'已排期':'Scheduled'],
      [Boolean(g.plans?.length),isZh()?'备课计划已记录':'Prep plan recorded']
    ];
  }

  function weekBoard(groups){
    const seven=new Date(now().getTime()+7*24*60*60*1000);const rows=groups.filter(g=>{const d=new Date(g.event?.start_at||g.scheduled_for||'2999-01-01');return d<=seven;});
    return `<section class="week-board glass"><div class="week-headline"><div><div class="eyebrow cyan">THIS WEEK</div><h3>${isZh()?'这周还有什么课？':'What is coming up?'}</h3></div><span class="brief-date">${rows.length} ${isZh()?'节待上':'upcoming'}</span></div><div class="week-lessons">${rows.length?rows.map(g=>`<button class="week-row ${selectedKey===g.key?'active':''}" onclick="window.selectPrepLesson('${esc(g.key)}')"><span class="week-time"><strong>${fmtDay(g.event?.start_at||g.scheduled_for)}</strong><small>${fmtTime(g.event?.start_at||g.scheduled_for)}</small></span><span class="week-students">${esc(g.names.join(' + '))}</span><span class="week-topic">${esc(g.title)}</span><span class="prep-status ${g.status}">${readyLabel(g)}</span></button>`).join(''):`<div class="prep-empty-week">${isZh()?'未来 7 天还没有排课':'No classes scheduled in the next 7 days'}</div>`}</div></section>`;
  }

  function hero(g){
    if(!g)return `<section class="next-lesson-hero glass"><div class="eyebrow cyan">NEXT LESSON</div><h2>${isZh()?'还没有下一节课':'No next lesson yet'}</h2><p>${isZh()?'从右上角新建备课，或先在课程日历安排下一节课。':'Create a prep plan or schedule the next lesson in the calendar.'}</p></section>`;
    const plan=rawPlan(g);const c=checks(g);
    return `<section class="next-lesson-hero glass"><div class="next-lesson-head"><div><div class="eyebrow cyan">NEXT LESSON</div><h2>${esc(g.names.join(' + '))}</h2><p>${esc(g.title)}</p><div class="next-lesson-meta"><span>${sessionLabel(g)}</span><span>${esc(when(g))}</span><span>${g.names.length>1?(isZh()?'共同课堂 · 个人记录分开':'Shared class · individual records'):isZh()?'个人课堂':'Individual lesson'}</span></div></div><span class="prep-status ${g.status}">${readyLabel(g)}</span></div><div class="lesson-brief-grid"><div class="lesson-brief-box"><div class="lesson-brief-label">WHAT</div><h4>${isZh()?'这节课做什么？':'What are we doing?'}</h4><p>${esc(g.tpl.what)}</p></div><div class="lesson-brief-box"><div class="lesson-brief-label">WHY</div><h4>${isZh()?'为什么现在学？':'Why now?'}</h4><p>${esc(g.tpl.why)}</p></div><div class="lesson-brief-box wide"><div class="lesson-brief-label">OUTCOME</div><h4>${isZh()?'下课前必须完成':'Must-have outcome'}</h4><p>${esc(g.tpl.outcome)}</p></div><div class="lesson-brief-box wide"><div class="lesson-brief-label">FLOW</div><div class="lesson-flow">${g.tpl.flow.map((x,i)=>`${i?'<i>→</i>':''}<span>${i+1}. ${esc(x)}</span>`).join('')}</div></div><div class="lesson-brief-box"><div class="lesson-brief-label">PREPARE</div><h4>${isZh()?'上课前准备':'Before class'}</h4><p>${g.tpl.prepare.map(x=>`✓ ${esc(x)}`).join('<br>')}</p></div><div class="lesson-brief-box"><div class="lesson-brief-label">ASSETS</div><div class="prep-checks">${c.map(([ok,label])=>`<span class="prep-check ${ok?'':'missing'}">${ok?'✓':'○'} ${esc(label)}</span>`).join('')}</div></div></div><div class="lesson-actions">${g.deck?`<a class="primary" href="${g.deck.href}" target="_blank" rel="noopener">▶ ${esc(g.deck.label)}</a>`:''}<button class="prep-secondary" onclick="openPrepModal()">✎ ${g.plans?.length?(isZh()?'编辑 / 新增备课':'Edit / add prep'):(isZh()?'补充备课计划':'Add prep plan')}</button>${!g.plans?.length?`<button class="prep-secondary" onclick="openPrepModal()">✨ ${isZh()?'根据课件生成备课':'Generate from deck'}</button>`:''}</div>${plan?`<details class="full-plan"><summary>${isZh()?'查看完整教案 / 原始备课笔记':'View full lesson plan / raw prep notes'}</summary><div class="full-plan-text">${esc(plan).replace(/\\\\n/g,'\n').replace(/\n/g,'<br>')}</div></details>`:''}</section>`;
  }

  function upcoming(groups,current){const rest=groups.filter(g=>!current||g.key!==current.key);if(!rest.length)return '';
    return `<div class="upcoming-heading"><div><div class="eyebrow">UPCOMING</div><h3>${isZh()?'其他待备课程':'Other upcoming lessons'}</h3></div><span>${isZh()?'历史课程已自动留在「过往课程」':'Completed lessons stay in Course History'}</span></div><div class="upcoming-lesson-grid">${rest.map(g=>`<article class="upcoming-lesson-card" onclick="window.selectPrepLesson('${esc(g.key)}')"><div class="upcoming-card-head"><div><div class="eyebrow">${sessionLabel(g)}</div><h4>${esc(g.names.join(' + '))}</h4></div><span class="prep-status ${g.status}">${readyLabel(g)}</span></div><div class="topic">${esc(g.title)}</div><p class="outcome">🎯 ${esc(g.tpl.outcome)}</p><div class="readiness-bar"><i style="width:${g.readiness}%"></i></div><div class="upcoming-card-foot"><small>${esc(when(g))}</small><small>${g.deck?'✓ Deck':'○ Deck'} · ${g.plans?.length?'✓ Plan':'○ Plan'}</small></div></article>`).join('')}</div>`;}

  function renderPrepDashboard(){
    if(!onPrepPage())return;
    const content=document.getElementById('content');if(!content)return;
    if(content.dataset.prepDashboardRendering==='1')return;
    const groups=groupLessons();if(!selectedKey||!groups.some(g=>g.key===selectedKey))selectedKey=groups[0]?.key||null;const current=groups.find(g=>g.key===selectedKey)||groups[0]||null;
    content.dataset.prepDashboardRendering='1';
    content.innerHTML=`<div class="prep-dashboard-v3"><div class="deck-library" hidden></div><div class="prep-topline"><div><div class="eyebrow cyan">NEXT LESSON CONTROL</div><h2>${isZh()?'下一节要上什么，一眼看清楚':'See the next lesson at a glance'}</h2><p>${isZh()?'这里只管理未来：先看这周，再聚焦下一节；完整教案需要时再展开。':'Future-only view: scan this week, focus the next class, expand full notes only when needed.'}</p></div><button class="primary" onclick="openPrepModal()">${isZh()?'+ 新建备课':'+ New prep'}</button></div>${weekBoard(groups)}${hero(current)}${upcoming(groups,current)}</div>`;
    delete content.dataset.prepDashboardRendering;
  }

  window.selectPrepLesson=key=>{selectedKey=key;renderPrepDashboard();};
  window.refreshPrepDashboard=renderPrepDashboard;

  const obs=new MutationObserver(()=>{if(onPrepPage()&&!document.querySelector('.prep-dashboard-v3'))setTimeout(renderPrepDashboard,20);});
  window.addEventListener('load',()=>{const c=document.getElementById('content');if(c)obs.observe(c,{childList:true,subtree:false});setTimeout(renderPrepDashboard,450);setInterval(()=>{if(onPrepPage())renderPrepDashboard();},1600);});
})();
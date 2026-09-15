(()=>{
  const isZh=()=>String(localStorage.getItem('studio_lang')||document.documentElement.lang||'zh').toLowerCase().startsWith('zh');
  const onPrepPage=()=>{
    const title=(document.getElementById('pageTitle')?.textContent||'').trim();
    const active=(document.querySelector('.nav-item.active')?.textContent||'').trim();
    return /备课|Lesson Prep/i.test(`${title} ${active}`);
  };

  const weeksZh=[
    ['Week 0','Kickoff / Project Discovery','确定用户、真实问题、可测量信号、AI 决策点和 MVP。申请线：建立 Evidence Folder + 个人贡献基线。'],
    ['Week 1','Sensors & Physical Signal','读 IMU / PPG 原始数据，理解 acceleration、gyro、sampling、noise。申请线：README 写 Problem / User / My Role。'],
    ['Week 2','Data Collection & Labeling','采集并标注时间序列 Dataset。申请线：写清 dataset 来源、类别、采集方式和个人工作。'],
    ['Week 3','First AI Model','训练 Random Forest / SVM baseline，做 inference 和 confusion matrix。申请线：练 60 秒“为什么需要 ML”。'],
    ['Week 4','Break the Model','主动制造 edge cases，Failure Log → Dataset v2 → Model v2。申请线：提炼一次真实失败→改进故事。'],
    ['Week 5','Product Integration','IMU → MCU → Model → Decision → BLE/Web/Alert。申请线：录 60–90 秒 Demo，讲清个人贡献。'],
    ['Week 6','Heart Rate Stretch Goal','加入 MAX30102 PPG 或基于证据决定不加入。申请线：练习解释“为什么我没有做某功能”。'],
    ['Week 7','Ethics & Safety','讨论 false alarm / missed fall / privacy / bias / uncertainty。申请线：Mock Engineering Interview。'],
    ['Week 8','WAICY + Application Package','完成 prototype、demo、pitch、Q&A，同时整理 GitHub、技术报告、活动描述、300 字故事和 90 秒面试答案。']
  ];
  const weeksEn=[
    ['Week 0','Kickoff / Project Discovery','Define user, problem, signal, AI decision and MVP. Application lane: start an Evidence Folder + ownership baseline.'],
    ['Week 1','Sensors & Physical Signal','Read raw IMU / PPG data. Application lane: README sections for Problem / User / My Role.'],
    ['Week 2','Data Collection & Labeling','Build and document the time-series dataset. Application lane: clearly describe data source, classes and personal contribution.'],
    ['Week 3','First AI Model','Train a Random Forest / SVM baseline and confusion matrix. Application lane: practice a 60-second “why ML” explanation.'],
    ['Week 4','Break the Model','Create edge cases, failure log, dataset v2 and model v2. Application lane: extract one authentic failure→iteration story.'],
    ['Week 5','Product Integration','Connect sensor → MCU → model → decision → alert. Application lane: record a 60–90 second demo with clear personal ownership.'],
    ['Week 6','Heart Rate Stretch Goal','Add PPG only if evidence supports it. Application lane: explain one feature deliberately excluded and why.'],
    ['Week 7','Ethics & Safety','Address false alarms, missed falls, privacy, bias and uncertainty. Application lane: mock engineering interview.'],
    ['Week 8','WAICY + Application Package','Finish prototype, demo, pitch and Q&A plus GitHub, technical report, activity description, reflective story and interview answer.']
  ];

  function render(){
    if(!onPrepPage()) return;
    const root=document.querySelector('.prep-dashboard-v3');
    if(!root || root.querySelector('.waicy-track')) return;
    const zh=isZh();
    const weeks=zh?weeksZh:weeksEn;
    const section=document.createElement('section');
    section.className='waicy-track glass';
    section.innerHTML=`
      <div class="waicy-head">
        <div>
          <div class="eyebrow cyan">SENIOR COMPETITION + APPLICATION TRACK</div>
          <h3>${zh?'WAICY Medical AI · 高年级竞赛与背景提升课程':'WAICY Medical AI · Competition & Application Track'}</h3>
          <p>${zh?'4–5 人小班 · 学生姓名待定 · 8 周项目制 · 技术项目与大学申请材料并行推进':'4–5 students · names TBD · 8-week project track · engineering and application evidence progress in parallel'}</p>
        </div>
        <span class="prep-status planned">${zh?'● 已纳入课程规划':'● Planned'}</span>
      </div>
      <div class="waicy-core">
        <div class="waicy-core-card"><span>PRODUCT</span><strong>AI Fall + Heart-Rate Safety Monitor</strong><small>${zh?'MVP 先做 IMU 跌倒检测；心率作为 Stretch Goal':'MVP: IMU fall detection first; heart rate is a stretch goal'}</small></div>
        <div class="waicy-core-card"><span>SYSTEM</span><strong>Sensor → MCU → Dataset → AI → Alert</strong><small>${zh?'先验证数据与模型，再做 wearable 外形':'Validate sensing/data/model before enclosure work'}</small></div>
        <div class="waicy-core-card"><span>COMPETITION</span><strong>WAICY AI Showcase</strong><small>${zh?'从第一周积累 rubric 对应证据、测试和 Q&A':'Collect rubric evidence, testing and Q&A from week 1'}</small></div>
        <div class="waicy-core-card"><span>APPLICATION</span><strong>Portfolio + Essay + Interview</strong><small>${zh?'GitHub · 技术报告 · Demo · 活动描述 · 反思故事 · 90 秒回答':'GitHub · report · demo · activity description · reflection · 90-sec answer'}</small></div>
      </div>
      <details class="waicy-kickoff" open>
        <summary>${zh?'第一次 Meeting · Project Discovery':'Kickoff · Project Discovery'}</summary>
        <div class="waicy-kickoff-grid">
          <div><b>WHO</b><span>${zh?'老人 / 独居者 / 运动者 / caregiver？':'Older adult / person living alone / athlete / caregiver?'}</span></div>
          <div><b>PROBLEM</b><span>${zh?'具体发生什么，而不是“做医疗 AI”':'What exactly happens, not “build medical AI”'}</span></div>
          <div><b>SIGNAL</b><span>${zh?'IMU、PPG，还是其他可测量数据？':'IMU, PPG or another measurable signal?'}</span></div>
          <div><b>AI</b><span>${zh?'哪一步真的需要模型，而不是 if rule？':'Which decision truly needs a model rather than an if-rule?'}</span></div>
          <div><b>ACTION</b><span>${zh?'检测后设备实际要做什么？':'What should the device actually do after detection?'}</span></div>
          <div><b>EVIDENCE</b><span>${zh?'怎么证明它有效、怎么记录失败？':'How will we prove it works and record failures?'}</span></div>
        </div>
      </details>
      <details class="waicy-application" open>
        <summary>${zh?'大学申请 / 背景提升并行线':'University Application / Portfolio Lane'}</summary>
        <div class="waicy-application-grid">
          <div><b>POSITIONING</b><span>${zh?'Independent AI Research & Product Project':'Independent AI Research & Product Project'}</span><small>Industry Mentor: Chongyu Yuan — Deep Learning Engineer at Matt3r Technologies</small></div>
          <div><b>ACTIVITY</b><span>${zh?'把几个月项目压缩成一条可验证的申请活动描述。':'Compress months of work into one evidence-based activity description.'}</span></div>
          <div><b>REFLECTION</b><span>${zh?'用真实失败、判断改变和迭代写 personal profile / supplemental story。':'Turn a real failure, changed assumption and iteration into a reflective application story.'}</span></div>
          <div><b>INTERVIEW</b><span>${zh?'训练 60–90 秒回答：Problem → My Work → Failure → Learning。':'Practice a 60–90 sec answer: Problem → My Work → Failure → Learning.'}</span></div>
          <div><b>TECH Q&A</b><span>${zh?'能独立回答 Why this model? Dataset? Metrics? Failure? Limitations?':'Independently defend model choice, dataset, metrics, failures and limitations.'}</span></div>
          <div><b>EVIDENCE FOLDER</b><span>${zh?'持续保存 commit、实验、confusion matrix、失败截图、Demo 和个人贡献。':'Continuously save commits, experiments, confusion matrices, failures, demos and personal ownership.'}</span></div>
        </div>
      </details>
      <div class="waicy-weeks">${weeks.map(([w,t,d])=>`<article><span>${w}</span><div><h4>${t}</h4><p>${d}</p></div></article>`).join('')}</div>
      <div class="waicy-bottom">
        <div><b>${zh?'最终 AI Portfolio Package':'Final AI Portfolio Package'}</b><span>${zh?'Flagship Project · GitHub · 5–10 页技术报告 · 2–3 分钟 Demo · Competition · Activity Description · 250–400 字反思 · 90 秒 Interview · Mentor Evaluation':'Flagship project · GitHub · technical report · demo · competition · activity description · reflection · interview · mentor evaluation'}</span></div>
        <div><b>${zh?'身份边界':'Attribution boundary'}</b><span>${zh?'可写 mentor 的 Matt3r 职位，但不把项目写成 Matt3r internship / collaboration，除非公司正式批准。':'Mentor industry role may be stated; do not claim Matt3r internship/collaboration unless formally approved.'}</span></div>
        <a href="https://github.com/Yuanchongyu/chongyu-studio-os/blob/main/docs/WAICY_MEDICAL_AI_TRACK.md" target="_blank" rel="noopener">${zh?'查看完整竞赛 + 申请教案 ↗':'Open full competition + application curriculum ↗'}</a>
      </div>`;
    root.appendChild(section);
  }

  const obs=new MutationObserver(()=>setTimeout(render,30));
  window.addEventListener('load',()=>{
    const c=document.getElementById('content');
    if(c) obs.observe(c,{childList:true,subtree:true});
    setTimeout(render,700);
  });
})();
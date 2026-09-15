(()=>{
  const isZh=()=>String(localStorage.getItem('studio_lang')||document.documentElement.lang||'zh').toLowerCase().startsWith('zh');
  const onPrepPage=()=>{
    const title=(document.getElementById('pageTitle')?.textContent||'').trim();
    const active=(document.querySelector('.nav-item.active')?.textContent||'').trim();
    return /备课|Lesson Prep/i.test(`${title} ${active}`);
  };

  const weeksZh=[
    ['Week 0','Kickoff / Project Discovery','确定用户、真实问题、可测量信号、AI 决策点和 MVP。输出：Problem Statement + Architecture + MVP Scope。'],
    ['Week 1','Sensors & Physical Signal','读 IMU / PPG 原始数据，理解 acceleration、gyro、sampling、noise。输出：可视化真实传感器信号。'],
    ['Week 2','Data Collection & Labeling','采集 walking / sitting / jump / lying / safe fall proxy，建立时间序列 Dataset。输出：Dataset v1 + 类别统计。'],
    ['Week 3','First AI Model','训练 Random Forest / SVM baseline，做 inference 和 confusion matrix。输出：Fall / Non-fall classifier v1。'],
    ['Week 4','Break the Model','主动制造 fast sitting、jump、device drop、不同人等 edge cases。输出：Failure Log → Dataset v2 → Model v2。'],
    ['Week 5','Product Integration','IMU → MCU → Model → Decision → BLE/Web/Alert，完成端到端系统。输出：可现场 Demo 的 MVP。'],
    ['Week 6','Heart Rate Stretch Goal','加入 MAX30102 PPG，学习 motion artifact / confidence / multimodal risk。输出：PPG demo 或基于证据决定不纳入最终版。'],
    ['Week 7','Ethics & Safety','系统讨论 false alarm / missed fall / privacy / bias / uncertainty。输出：Ethics & Limitations + Data Flow。'],
    ['Week 8','WAICY Submission & Pitch','整理 prototype、dataset、model、testing、iteration、ethics、demo video、pitch 和 Q&A。']
  ];
  const weeksEn=[
    ['Week 0','Kickoff / Project Discovery','Define the user, real problem, measurable signal, AI decision point and MVP. Deliver: problem statement, architecture and scope.'],
    ['Week 1','Sensors & Physical Signal','Read raw IMU / PPG signals; understand acceleration, gyro, sampling and noise. Deliver: live sensor visualization.'],
    ['Week 2','Data Collection & Labeling','Collect walking / sitting / jump / lying / safe fall-proxy data and build a time-series dataset.'],
    ['Week 3','First AI Model','Train a Random Forest / SVM baseline, run inference and create a confusion matrix.'],
    ['Week 4','Break the Model','Create edge cases intentionally, log failures, expand the dataset and retrain model v2.'],
    ['Week 5','Product Integration','Connect sensor → MCU → model → decision → BLE/web/alert into a live end-to-end MVP.'],
    ['Week 6','Heart Rate Stretch Goal','Add MAX30102 PPG only after the fall-detection MVP works; study motion artifact and confidence.'],
    ['Week 7','Ethics & Safety','Address false alarms, missed falls, privacy, bias and uncertainty; create data-flow and limitations.'],
    ['Week 8','WAICY Submission & Pitch','Package prototype, dataset, model, testing, iteration, ethics, demo video, pitch and Q&A.']
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
          <div class="eyebrow cyan">SENIOR COMPETITION TRACK</div>
          <h3>${zh?'WAICY Medical AI · 高年级竞赛课程':'WAICY Medical AI · Senior Competition Track'}</h3>
          <p>${zh?'4–5 人小班 · 学生姓名待定 · 8 周项目制 · 目标：WAICY AI Showcase':'4–5 students · names TBD · 8-week project-based track · target: WAICY AI Showcase'}</p>
        </div>
        <span class="prep-status planned">${zh?'● 已纳入课程规划':'● Planned'}</span>
      </div>
      <div class="waicy-core">
        <div class="waicy-core-card"><span>PRODUCT</span><strong>AI Fall + Heart-Rate Safety Monitor</strong><small>${zh?'MVP 先做 IMU 跌倒检测；心率作为 Stretch Goal':'MVP: IMU fall detection first; heart rate is a stretch goal'}</small></div>
        <div class="waicy-core-card"><span>SYSTEM</span><strong>Sensor → MCU → Dataset → AI → Alert</strong><small>${zh?'先验证数据与模型，再做 wearable 外形':'Validate sensing/data/model before enclosure work'}</small></div>
        <div class="waicy-core-card"><span>RUBRIC</span><strong>AI 25 · Technical 25 · 其余 50</strong><small>${zh?'从第一周开始积累比赛证据，而不是最后补材料':'Collect competition evidence from week 1'}</small></div>
      </div>
      <details class="waicy-kickoff" open>
        <summary>${zh?'本周六第一次 Meeting · Project Discovery':'Saturday Kickoff · Project Discovery'}</summary>
        <div class="waicy-kickoff-grid">
          <div><b>WHO</b><span>${zh?'老人 / 独居者 / 运动者 / caregiver？':'Older adult / person living alone / athlete / caregiver?'}</span></div>
          <div><b>PROBLEM</b><span>${zh?'具体发生什么，而不是“做医疗 AI”':'What exactly happens, not “build medical AI”'}</span></div>
          <div><b>SIGNAL</b><span>${zh?'IMU、PPG，还是其他可测量数据？':'IMU, PPG or another measurable signal?'}</span></div>
          <div><b>AI</b><span>${zh?'哪一步真的需要模型，而不是 if rule？':'Which decision truly needs a model rather than an if-rule?'}</span></div>
          <div><b>ACTION</b><span>${zh?'检测后设备实际要做什么？':'What should the device actually do after detection?'}</span></div>
          <div><b>EVIDENCE</b><span>${zh?'怎么证明它有效、怎么记录失败？':'How will we prove it works and record failures?'}</span></div>
        </div>
      </details>
      <div class="waicy-weeks">${weeks.map(([w,t,d])=>`<article><span>${w}</span><div><h4>${t}</h4><p>${d}</p></div></article>`).join('')}</div>
      <div class="waicy-bottom">
        <div><b>${zh?'硬件基线':'Hardware baseline'}</b><span>${zh?'XIAO nRF52840 Sense 或 ESP32 · IMU · MAX30102 · LED/Buzzer/Vibration · Breadboard':'XIAO nRF52840 Sense or ESP32 · IMU · MAX30102 · LED/Buzzer/Vibration · Breadboard'}</span></div>
        <div><b>${zh?'医疗边界':'Medical boundary'}</b><span>${zh?'教育原型，不做疾病诊断；优先表述为异常模式检测 / caregiver alert。':'Educational prototype, not disease diagnosis; frame as unusual-pattern detection / caregiver alert.'}</span></div>
        <a href="https://github.com/Yuanchongyu/chongyu-studio-os/blob/main/docs/WAICY_MEDICAL_AI_TRACK.md" target="_blank" rel="noopener">${zh?'查看完整 8 周教案 ↗':'Open full 8-week curriculum ↗'}</a>
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
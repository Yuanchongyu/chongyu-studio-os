(()=>{
  const isZh=()=>String(localStorage.getItem('studio_lang')||document.documentElement.lang||'zh').toLowerCase().startsWith('zh');
  const button=(href,label)=>`<a class="deck-open-btn" href="${href}" target="_blank" rel="noopener">${label} <span>↗</span></a>`;
  function onPrepPage(){
    const title=(document.getElementById('pageTitle')?.textContent||'').trim();
    const active=(document.querySelector('.nav-item.active')?.textContent||'').trim();
    return /备课|Lesson Prep/i.test(`${title} ${active}`);
  }
  function addLibrary(){
    const content=document.getElementById('content');if(!content||content.querySelector('.deck-library'))return;
    const zh=isZh();
    const panel=document.createElement('section');panel.className='deck-library glass';
    panel.innerHTML=`<div class="deck-library-head"><div><div class="eyebrow cyan">${zh?'课堂课件':'TEACHING DECKS'}</div><h3>${zh?'上课时直接打开讨论':'Open a deck and teach from the screen'}</h3><p>${zh?'课件和备课记录分开保存；可以直接投屏，也可以边讲边和孩子讨论。':'Decks stay separate from written prep so you can present and discuss them live.'}</p></div><span class="deck-count">2 ${zh?'份课件':'decks'}</span></div><div class="deck-library-grid"><article class="deck-library-card face"><div class="deck-card-icon">◎</div><div class="deck-card-body"><span>${zh?'Ryan & Spencer · 第1节':'Ryan & Spencer · Session 1'}</span><h4>${zh?'AI 基础 + 人脸识别门禁系统':'AI Fundamentals + Face Access System'}</h4><p>${zh?'Dataset、Train、Validation、Inference → 人脸检测 → 身份识别 → Family Member 数据库 → 权限判断。':'Dataset, training, validation and inference through a complete face-access product.'}</p>${button('/decks/face-access.html',zh?'打开人脸识别课件':'Open face-access deck')}</div></article><article class="deck-library-card imu"><div class="deck-card-icon">⌁</div><div class="deck-card-body"><span>${zh?'Marcos & Mason · 第7节':'Marcos & Mason · Session 7'}</span><h4>${zh?'MotionAccess · IMU + 机器学习':'MotionAccess · IMU + Machine Learning'}</h4><p>${zh?'自己采集 IMU 数据、打标签、训练动作分类器、实时推理，并把动作映射成电脑操作。':'Collect IMU data, label it, train a gesture classifier and control a computer in real time.'}</p>${button('/decks/imu-motionaccess.html',zh?'打开 IMU / MotionAccess 课件':'Open IMU / MotionAccess deck')}</div></article></div>`;
    const intro=content.querySelector('.page-intro');if(intro)intro.insertAdjacentElement('afterend',panel);else content.prepend(panel);
  }
  function addStudentButtons(){
    document.querySelectorAll('#content .prep-group,#content .crud-card').forEach(card=>{
      if(card.querySelector('.student-deck-actions'))return;
      const headings=[...card.querySelectorAll('h2,h3,h4')].map(x=>(x.textContent||'').trim());
      const text=card.textContent||'';let href='',label='';
      if(headings.includes('Marcos')||headings.includes('Mason')||/MotionAccess|IMU|动作 AI/i.test(text)){href='/decks/imu-motionaccess.html';label=isZh()?'打开第7节 IMU 课件':'Open Session 7 IMU deck';}
      else if(headings.includes('Ryan')||headings.includes('Spencer')||/人脸识别门禁|AI 基础|Face Recognition/i.test(text)){href='/decks/face-access.html';label=isZh()?'打开人脸识别课件':'Open face-access deck';}
      if(!href)return;const box=document.createElement('div');box.className='deck-actions student-deck-actions';box.innerHTML=button(href,label);card.appendChild(box);
    });
  }
  function patch(){if(!onPrepPage())return;addLibrary();addStudentButtons();}
  const obs=new MutationObserver(()=>setTimeout(patch,50));
  window.addEventListener('load',()=>{const c=document.getElementById('content');if(c)obs.observe(c,{childList:true,subtree:true});setTimeout(patch,350);setInterval(patch,1000)});
})();

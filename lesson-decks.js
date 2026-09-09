(()=>{
  function zh(){return (window.lang||localStorage.getItem('studio_lang')||'zh')==='zh'}
  function button(href,label){return `<a class="deck-open-btn" href="${href}" target="_blank" rel="noopener">${label} ↗</a>`}
  function patch(){
    if((window.current||'')!=='prep')return;
    document.querySelectorAll('#content .crud-card,#content .prep-card,#content section').forEach(card=>{
      if(card.dataset.deckPatched==='1')return;
      const t=card.textContent||'';
      let html='';
      if(t.includes('人脸识别门禁')||t.includes('AI 基础')) html+=button('/decks/face-access.html',zh()?'打开人脸识别课件':'Open face access deck');
      if(t.includes('IMU')||t.includes('MotionAccess')||t.includes('动作 AI')) html+=button('/decks/imu-motionaccess.html',zh()?'打开 IMU 课件':'Open IMU deck');
      if(!html)return;
      const box=document.createElement('div');box.className='deck-actions';box.innerHTML=html;card.appendChild(box);card.dataset.deckPatched='1';
    });
  }
  const obs=new MutationObserver(()=>setTimeout(patch,80));
  window.addEventListener('load',()=>{const c=document.getElementById('content');if(c)obs.observe(c,{childList:true,subtree:true});setTimeout(patch,600);setInterval(patch,1500)});
})();

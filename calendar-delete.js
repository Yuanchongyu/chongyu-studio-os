(()=>{
  const isZh=()=>typeof lang!=='undefined'?lang==='zh':true;
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  function fmt(v){const d=new Date(v);return d.toLocaleString(isZh()?'zh-CN':'en-CA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});}
  function renderManager(){
    if(typeof current==='undefined'||current!=='calendar')return;
    const host=document.querySelector('.calendar-layout');
    if(!host||document.getElementById('calendarEventManager'))return;
    const events=(window.STUDIO_EXT?.calendarEvents||[]).filter(e=>e.status!=='cancelled').sort((a,b)=>new Date(a.start_at)-new Date(b.start_at));
    const wrap=document.createElement('section');
    wrap.id='calendarEventManager';
    wrap.className='calendar-event-manager glass';
    wrap.innerHTML=`<div class="calendar-manager-head"><div><div class="eyebrow">${isZh()?'事件管理':'EVENT MANAGEMENT'}</div><h3>${isZh()?'日历事件':'Calendar events'}</h3></div><span>${events.length}</span></div>${events.length?`<div class="calendar-manager-list">${events.map(e=>`<article><div><b>${esc(e.title)}</b><span>${fmt(e.start_at)}</span><small>${esc(e.event_type||'event')}</small></div><button class="calendar-delete-btn" onclick="deleteCalendarEvent('${e.id}','${esc(e.title)}')">${isZh()?'删除':'Delete'}</button></article>`).join('')}</div>`:`<div class="empty-state compact">${isZh()?'暂无日历事件':'No calendar events'}</div>`}`;
    host.parentNode.insertBefore(wrap,host.nextSibling);
  }
  window.deleteCalendarEvent=async function(id,title=''){
    const msg=isZh()?`确定删除日历事件“${title}”吗？删除后不会影响已经保存的课程记录或备课。`:`Delete calendar event “${title}”? This will not delete saved lesson records or prep notes.`;
    if(!confirm(msg))return;
    try{
      const r=await fetch('/api/calendar-delete',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||`HTTP ${r.status}`);
      if(window.STUDIO_EXT)window.STUDIO_EXT.calendarEvents=(window.STUDIO_EXT.calendarEvents||[]).filter(e=>e.id!==id);
      document.getElementById('calendarEventManager')?.remove();
      if(typeof go==='function')go('calendar');
      setTimeout(renderManager,80);
    }catch(e){alert((isZh()?'删除失败：':'Delete failed: ')+e.message)}
  };
  const obs=new MutationObserver(()=>setTimeout(renderManager,40));
  window.addEventListener('load',()=>{const content=document.getElementById('content');if(content)obs.observe(content,{childList:true,subtree:true});setTimeout(renderManager,500)});
})();

(()=>{
  const isZh=()=>typeof lang!=='undefined'?lang==='zh':true;
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  function fmt(v){const d=new Date(v);return d.toLocaleString(isZh()?'zh-CN':'en-CA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});}
  function localInput(v){if(!v)return'';const d=new Date(v);const p=n=>String(n).padStart(2,'0');return`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;}
  function studentSlugByDbId(id){return (window.D?.students||window.STUDIO_DATA?.students||[]).find(s=>s.dbId===id)?.id||'';}
  function renderManager(){
    if(typeof current==='undefined'||current!=='calendar')return;
    const host=document.querySelector('.calendar-layout');
    if(!host||document.getElementById('calendarEventManager'))return;
    const events=(window.STUDIO_EXT?.calendarEvents||[]).filter(e=>e.status!=='cancelled').sort((a,b)=>new Date(a.start_at)-new Date(b.start_at));
    const wrap=document.createElement('section');
    wrap.id='calendarEventManager';
    wrap.className='calendar-event-manager glass';
    wrap.innerHTML=`<div class="calendar-manager-head"><div><div class="eyebrow">${isZh()?'事件管理':'EVENT MANAGEMENT'}</div><h3>${isZh()?'日历事件':'Calendar events'}</h3></div><span>${events.length}</span></div>${events.length?`<div class="calendar-manager-list">${events.map(e=>`<article><div><b>${esc(e.title)}</b><span>${fmt(e.start_at)}</span><small>${esc(e.event_type||'event')}</small></div><div class="calendar-event-actions"><button class="calendar-edit-btn" onclick="editCalendarEvent('${e.id}')">${isZh()?'编辑':'Edit'}</button><button class="calendar-delete-btn" onclick="deleteCalendarEvent('${e.id}','${esc(e.title)}')">${isZh()?'删除':'Delete'}</button></div></article>`).join('')}</div>`:`<div class="empty-state compact">${isZh()?'暂无日历事件':'No calendar events'}</div>`}`;
    host.parentNode.insertBefore(wrap,host.nextSibling);
  }
  window.editCalendarEvent=function(id){
    const e=(window.STUDIO_EXT?.calendarEvents||[]).find(x=>x.id===id);if(!e)return;
    const modal=document.getElementById('modal');modal.classList.remove('hidden');
    const students=window.D?.students||[];
    const selectedSlug=studentSlugByDbId(e.student_id);
    modal.innerHTML=`<div class="modal-card glass"><div class="eyebrow cyan">${isZh()?'课程日历':'COURSE CALENDAR'}</div><h2>${isZh()?'编辑日程':'Edit event'}</h2><label>${isZh()?'标题':'Title'}<input id="editEvtTitle" value="${esc(e.title)}"></label><div class="form-grid"><label>${isZh()?'学生（可选）':'Student (optional)'}<select id="editEvtStudent"><option value="">—</option>${students.map(s=>`<option value="${esc(s.id)}" ${s.id===selectedSlug?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label><label>${isZh()?'类型':'Type'}<select id="editEvtType"><option value="lesson" ${e.event_type==='lesson'?'selected':''}>${isZh()?'课程':'Lesson'}</option><option value="prep" ${e.event_type==='prep'?'selected':''}>${isZh()?'备课':'Prep'}</option><option value="content" ${e.event_type==='content'?'selected':''}>${isZh()?'内容':'Content'}</option><option value="admin" ${e.event_type==='admin'?'selected':''}>${isZh()?'运营':'Admin'}</option><option value="other" ${e.event_type==='other'?'selected':''}>${isZh()?'其他':'Other'}</option></select></label><label>${isZh()?'开始':'Start'}<input id="editEvtStart" type="datetime-local" value="${localInput(e.start_at)}"></label><label>${isZh()?'结束':'End'}<input id="editEvtEnd" type="datetime-local" value="${localInput(e.end_at)}"></label></div><label>${isZh()?'地点':'Location'}<input id="editEvtLocation" value="${esc(e.location||'')}"></label><label>${isZh()?'备注':'Notes'}<textarea id="editEvtNotes">${esc(e.notes||'')}</textarea></label><div class="modal-actions"><button class="ghost" onclick="closeModal()">${isZh()?'取消':'Cancel'}</button><button class="primary" onclick="saveEditedCalendarEvent('${e.id}')">${isZh()?'保存修改':'Save changes'}</button></div></div>`;
  };
  window.saveEditedCalendarEvent=async function(id){
    try{
      const start=document.getElementById('editEvtStart').value,end=document.getElementById('editEvtEnd').value;
      const r=await fetch('/api/calendar-update',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,title:document.getElementById('editEvtTitle').value,student_slug:document.getElementById('editEvtStudent').value||null,event_type:document.getElementById('editEvtType').value,start_at:new Date(start).toISOString(),end_at:end?new Date(end).toISOString():null,location:document.getElementById('editEvtLocation').value,notes:document.getElementById('editEvtNotes').value})});
      const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`HTTP ${r.status}`);
      if(window.STUDIO_EXT&&d.event)window.STUDIO_EXT.calendarEvents=(window.STUDIO_EXT.calendarEvents||[]).map(e=>e.id===id?d.event:e);
      closeModal();document.getElementById('calendarEventManager')?.remove();if(typeof go==='function')go('calendar');setTimeout(renderManager,80);
    }catch(e){alert((isZh()?'保存失败：':'Save failed: ')+e.message)}
  };
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

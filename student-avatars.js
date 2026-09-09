(()=>{
  const state={portraits:{},loaded:false,loading:false};
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  async function loadPortraits(){
    if(state.loading)return;state.loading=true;
    try{const r=await fetch('/api/student-portraits',{credentials:'same-origin'});if(!r.ok)return;const d=await r.json();state.portraits=d.portraits||{};state.loaded=true;await hydrate();}
    catch(e){console.warn('portrait load',e)}finally{state.loading=false}
  }
  const urlFor=slug=>state.portraits[String(slug||'').toLowerCase()]?.url||null;
  function img(url,name,cls='student-avatar-photo'){return `<img class="${cls}" src="${esc(url)}" alt="${esc(name)}" loading="lazy">`;}
  async function hydrateStudents(){
    const students=window.STUDIO_CRUD?.students||[];const cards=[...document.querySelectorAll('.crud-card')];
    for(const s of students){const url=urlFor(s.slug);if(!url)continue;const card=cards.find(c=>c.querySelector('h3')?.textContent?.trim()===s.name);const host=card?.querySelector('.digital-avatar');if(!host||host.dataset.avatarLoaded==='1')continue;host.innerHTML=img(url,s.name);host.dataset.avatarLoaded='1';host.classList.add('has-photo');}
  }
  function hydrateParentShare(){
    const names=['Marcos','Mason'];
    for(const name of names){const url=urlFor(name.toLowerCase());if(!url)continue;
      const cards=[...document.querySelectorAll('#content .glass,#content article,#content section')].filter(c=>{const h=[...c.querySelectorAll('h2,h3,h4,strong')].find(x=>x.textContent?.trim()===name);return Boolean(h)});
      for(const card of cards){if(card.dataset.parentAvatarLoaded==='1')continue;
        const candidates=[...card.querySelectorAll('div,span')].filter(el=>{const t=(el.textContent||'').trim();return t==='MA'&&el.children.length===0});
        const initials=candidates.find(el=>{const r=el.getBoundingClientRect();return r.width>=28&&r.width<=140&&r.height>=28&&r.height<=140})||candidates[0];
        if(!initials)continue;const host=initials.parentElement;if(!host)continue;host.classList.add('parent-avatar-host');initials.style.display='none';host.insertAdjacentHTML('beforeend',img(url,name,'parent-avatar-photo'));card.dataset.parentAvatarLoaded='1';
      }
    }
  }
  async function hydrate(){if(!state.loaded)return;await hydrateStudents();hydrateParentShare();}
  const obs=new MutationObserver(()=>setTimeout(hydrate,50));
  window.addEventListener('load',()=>{const c=document.getElementById('content');if(c)obs.observe(c,{childList:true,subtree:true});setTimeout(loadPortraits,400);setInterval(hydrate,1200)});
  window.refreshStudentAvatars=async()=>{state.loaded=false;state.portraits={};await loadPortraits();};
})();

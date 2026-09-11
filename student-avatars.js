(()=>{
  const CACHE_PREFIX='chongyu_student_portrait_';
  const CACHE_TTL_MS=1000*60*30;
  const state={portraits:{},loading:false};
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  function readPortraitCache(slug){try{const raw=localStorage.getItem(CACHE_PREFIX+slug);if(!raw)return null;const d=JSON.parse(raw);if(!d?.url||!d.savedAt||Date.now()-d.savedAt>CACHE_TTL_MS){localStorage.removeItem(CACHE_PREFIX+slug);return null}return d.url}catch{return null}}
  function writePortraitCache(slug,url){try{localStorage.setItem(CACHE_PREFIX+slug,JSON.stringify({url,savedAt:Date.now()}))}catch{}}
  async function portraitFor(slug){
    slug=String(slug||'').toLowerCase();if(slug in state.portraits)return state.portraits[slug];
    const cached=readPortraitCache(slug);if(cached){state.portraits[slug]=cached;return cached}
    try{const r=await fetch(`/api/parent-portal?student=${encodeURIComponent(slug)}`,{credentials:'same-origin'});if(!r.ok){state.portraits[slug]=null;return null;}const d=await r.json();const p=(d.artifacts||[]).find(a=>a.artifact_type==='portrait'&&a.signed_url);const url=p?.signed_url||null;state.portraits[slug]=url;if(url)writePortraitCache(slug,url);return url;}catch(e){state.portraits[slug]=null;return null;}
  }
  function img(url,name,cls='student-avatar-photo'){return `<img class="${cls}" src="${esc(url)}" alt="${esc(name)}" loading="eager" decoding="async" fetchpriority="high">`;}
  function allStudents(){
    const data=window.STUDIO_DATA?.students||[];
    const crud=window.STUDIO_CRUD?.students||[];
    const byName=new Map();
    [...data,...crud].forEach(s=>{if(s?.name&&!byName.has(s.name))byName.set(s.name,s)});
    return [...byName.values()];
  }
  function slugForStudent(s){return String(s?.slug||s?.id||s?.name||'').toLowerCase();}
  async function hydrateStudents(){
    const students=window.STUDIO_CRUD?.students||[];const cards=[...document.querySelectorAll('.crud-card')];
    await Promise.all(students.map(async s=>{const card=cards.find(c=>c.querySelector('h3')?.textContent?.trim()===s.name);const host=card?.querySelector('.digital-avatar');if(!host||host.dataset.avatarLoaded==='1')return;const url=await portraitFor(slugForStudent(s));if(!url)return;host.innerHTML=img(url,s.name);host.dataset.avatarLoaded='1';host.classList.add('has-photo');}));
  }
  async function hydrateLearningHub(){
    const host=document.querySelector('.learning-hub .student-overview .student-photo');
    const name=document.querySelector('.learning-hub .student-overview .student-identity h2')?.textContent?.trim();
    if(!host||!name||host.dataset.avatarLoaded==='1')return;
    const s=allStudents().find(x=>String(x.name||'').trim()===name);
    const slug=slugForStudent(s)||name.toLowerCase();
    const url=await portraitFor(slug);if(!url)return;
    host.innerHTML=img(url,name,'student-avatar-photo');
    host.dataset.avatarLoaded='1';host.classList.add('has-photo');
  }
  async function hydrateParentShare(){
    await Promise.all(allStudents().map(async s=>{const name=s.name,slug=slugForStudent(s),url=await portraitFor(slug);if(!url)return;
      const cards=[...document.querySelectorAll('#content .glass,#content article,#content section')].filter(c=>[...c.querySelectorAll('h2,h3,h4,strong')].some(x=>x.textContent?.trim()===name));
      for(const card of cards){if(card.dataset.parentAvatarLoaded==='1')continue;const initials=(name||'').slice(0,2).toUpperCase();const marker=[...card.querySelectorAll('div,span')].find(el=>(el.textContent||'').trim()===initials&&el.children.length===0);if(!marker)continue;const host=marker.parentElement;if(!host)continue;host.classList.add('parent-avatar-host');marker.style.display='none';host.insertAdjacentHTML('beforeend',img(url,name,'parent-avatar-photo'));card.dataset.parentAvatarLoaded='1';}
    }));
  }
  async function hydrate(){if(state.loading)return;state.loading=true;try{await Promise.all([hydrateStudents(),hydrateLearningHub(),hydrateParentShare()])}finally{state.loading=false}}
  const obs=new MutationObserver(()=>setTimeout(hydrate,40));
  window.addEventListener('load',()=>{const c=document.getElementById('content');if(c)obs.observe(c,{childList:true,subtree:true});setTimeout(hydrate,120);setInterval(hydrate,1400)});
  window.refreshStudentAvatars=async()=>{state.portraits={};for(const s of allStudents()){try{localStorage.removeItem(CACHE_PREFIX+slugForStudent(s))}catch{}}document.querySelectorAll('[data-avatar-loaded]').forEach(el=>delete el.dataset.avatarLoaded);await hydrate();};
})();
(()=>{
  const state={portraits:{},loading:false};
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  async function portraitFor(slug){
    slug=String(slug||'').toLowerCase();if(slug in state.portraits)return state.portraits[slug];
    try{const r=await fetch(`/api/parent-portal?student=${encodeURIComponent(slug)}`,{credentials:'same-origin'});if(!r.ok){state.portraits[slug]=null;return null;}const d=await r.json();const p=(d.artifacts||[]).find(a=>a.artifact_type==='portrait'&&a.signed_url);const url=p?.signed_url||null;state.portraits[slug]=url;return url;}catch(e){state.portraits[slug]=null;return null;}
  }
  function img(url,name,cls='student-avatar-photo'){return `<img class="${cls}" src="${esc(url)}" alt="${esc(name)}" loading="lazy">`;}
  async function hydrateStudents(){
    const students=window.STUDIO_CRUD?.students||[];const cards=[...document.querySelectorAll('.crud-card')];
    for(const s of students){const card=cards.find(c=>c.querySelector('h3')?.textContent?.trim()===s.name);const host=card?.querySelector('.digital-avatar');if(!host||host.dataset.avatarLoaded==='1')continue;const url=await portraitFor(s.slug);if(!url)continue;host.innerHTML=img(url,s.name);host.dataset.avatarLoaded='1';host.classList.add('has-photo');}
  }
  async function hydrateParentShare(){
    for(const name of ['Marcos','Mason']){const slug=name.toLowerCase(),url=await portraitFor(slug);if(!url)continue;
      const cards=[...document.querySelectorAll('#content .glass,#content article,#content section')].filter(c=>[...c.querySelectorAll('h2,h3,h4,strong')].some(x=>x.textContent?.trim()===name));
      for(const card of cards){if(card.dataset.parentAvatarLoaded==='1')continue;const initials=[...card.querySelectorAll('div,span')].find(el=>(el.textContent||'').trim()==='MA'&&el.children.length===0);if(!initials)continue;const host=initials.parentElement;if(!host)continue;host.classList.add('parent-avatar-host');initials.style.display='none';host.insertAdjacentHTML('beforeend',img(url,name,'parent-avatar-photo'));card.dataset.parentAvatarLoaded='1';}
    }
  }
  async function hydrate(){await hydrateStudents();await hydrateParentShare();}
  const obs=new MutationObserver(()=>setTimeout(hydrate,60));
  window.addEventListener('load',()=>{const c=document.getElementById('content');if(c)obs.observe(c,{childList:true,subtree:true});setTimeout(hydrate,600);setInterval(hydrate,1400)});
  window.refreshStudentAvatars=async()=>{state.portraits={};await hydrate();};
})();

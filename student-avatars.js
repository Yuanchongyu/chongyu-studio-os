(()=>{
  const cache=new Map();
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  async function portraitFor(slug){
    if(cache.has(slug))return cache.get(slug);
    try{
      const r=await fetch(`/api/parent-portal?student=${encodeURIComponent(slug)}`,{credentials:'same-origin'});
      if(!r.ok){cache.set(slug,null);return null;}
      const d=await r.json();
      const p=(d.artifacts||[]).find(a=>a.artifact_type==='portrait'&&a.signed_url);
      const url=p?.signed_url||null;cache.set(slug,url);return url;
    }catch(_){cache.set(slug,null);return null;}
  }
  async function hydrate(){
    if(typeof current!=='undefined'&&current!=='students')return;
    const students=window.STUDIO_CRUD?.students||[];
    const cards=[...document.querySelectorAll('.crud-card')];
    for(const s of students){
      const card=cards.find(c=>c.querySelector('h3')?.textContent?.trim()===s.name);
      const host=card?.querySelector('.digital-avatar');
      if(!host||host.dataset.avatarLoaded==='1')continue;
      const url=await portraitFor(s.slug);
      if(!url)continue;
      host.innerHTML=`<img class="student-avatar-photo" src="${esc(url)}" alt="${esc(s.name)}">`;
      host.dataset.avatarLoaded='1';
    }
  }
  const obs=new MutationObserver(()=>setTimeout(hydrate,60));
  window.addEventListener('load',()=>{const c=document.getElementById('content');if(c)obs.observe(c,{childList:true,subtree:true});setTimeout(hydrate,600)});
  window.refreshStudentAvatars=()=>{cache.clear();hydrate();};
})();

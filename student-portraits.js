(()=>{
  const state={portraits:{},loaded:false,loading:false};
  const norm=s=>String(s||'').trim().toLowerCase();
  async function load(){if(state.loading)return;state.loading=true;try{const r=await fetch('/api/student-portraits',{credentials:'same-origin'});if(!r.ok)return;const d=await r.json();state.portraits=d.portraits||{};state.loaded=true;apply();}catch(e){console.warn('portrait load',e)}finally{state.loading=false}}
  function portraitForName(name){const slug=norm(name);return state.portraits[slug]?.url||'';}
  function makeImg(url,name,cls='student-photo'){const img=document.createElement('img');img.src=url;img.alt=`${name} portrait`;img.className=cls;img.loading='lazy';img.referrerPolicy='no-referrer';return img;}
  function patchStudentCards(){document.querySelectorAll('.crud-student-header').forEach(head=>{const name=head.querySelector('h3')?.textContent?.trim();const url=portraitForName(name);if(!url)return;const host=head.querySelector('.digital-avatar');if(!host||host.dataset.photoReady==='1')return;host.dataset.photoReady='1';host.innerHTML='';host.appendChild(makeImg(url,name,'student-photo'));host.classList.add('has-photo');});}
  function patchParentCards(){
    document.querySelectorAll('#content .glass, #content article, #content section').forEach(card=>{
      if(card.dataset?.portraitPatched==='1')return;
      const text=card.textContent||'';let name='';for(const n of ['Marcos','Mason']){if(text.includes(n)){name=n;break}}if(!name)return;
      const url=portraitForName(name);if(!url)return;
      const initials=[...card.querySelectorAll('div,span')].find(el=>{const t=(el.textContent||'').trim();return t===(name==='Marcos'?'MA':'MA')&&el.children.length===0});
      if(!initials)return;
      const host=initials.parentElement;if(!host)return;
      card.dataset.portraitPatched='1';host.classList.add('portrait-host');initials.style.display='none';host.appendChild(makeImg(url,name,'parent-card-photo'));
    });
  }
  function apply(){if(!state.loaded)return;patchStudentCards();patchParentCards();}
  const obs=new MutationObserver(()=>setTimeout(apply,30));
  window.addEventListener('load',()=>{const content=document.getElementById('content');if(content)obs.observe(content,{childList:true,subtree:true});setTimeout(load,300);setInterval(apply,1200)});
  window.refreshStudentPortraits=async()=>{state.loaded=false;await load()};
})();

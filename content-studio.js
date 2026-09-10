(()=>{
  const isZh=()=>String(localStorage.getItem('studio_lang')||document.documentElement.lang||'zh').toLowerCase().startsWith('zh');
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  let activeTab=localStorage.getItem('studio_content_tab')||'draft';

  function onContentPage(){
    const title=(document.getElementById('pageTitle')?.textContent||'').trim();
    const active=(document.querySelector('.nav-item.active')?.textContent||'').trim();
    return /小红书|Rednote|Content Studio/i.test(`${title} ${active}`);
  }
  function rows(){return window.STUDIO_CRUD?.content_items||[];}
  function normalizedStatus(c){return c.status==='idea'?'draft':c.status;}
  function tabRows(tab){return rows().filter(c=>normalizedStatus(c)===tab);}
  function txStatus(tab){const m={draft:['创作中','In progress'],ready:['发布就绪','Publish ready'],published:['已发布','Published']};return m[tab][isZh()?0:1];}
  function tabDesc(tab){const m={draft:['还在写、拍、改或补素材','Still being written, filmed or refined'],ready:['发布包已齐，等你复制到小红书','Publish pack complete; ready to copy into Rednote'],published:['已经发出，进入内容资产库','Live content kept as reusable assets']};return m[tab][isZh()?0:1];}
  function typeFor(c){const t=`${c.pillar||''} ${c.title||''} ${c.body||''}`;if(/video|视频|口播|script/i.test(t))return isZh()?'视频':'VIDEO';return isZh()?'图文':'POST';}
  function progressFor(c,tab){if(tab==='published')return 100;if(tab==='ready')return 100;let score=25;if(c.title)score+=20;if(c.hook)score+=20;if(c.body&&String(c.body).length>180)score+=25;if(c.pillar)score+=10;return Math.min(95,score);}
  function packChecks(c){return [
    [Boolean(c.title),isZh()?'标题':'Title'],
    [Boolean(c.body||c.hook),isZh()?'正文 / 脚本':'Copy / script'],
    [true,isZh()?'发布文案':'Publish copy'],
    [false,isZh()?'封面 / 素材':'Cover / media']
  ];}
  function dateText(c){const v=c.updated_at||c.created_at||c.published_at;if(!v)return '';try{return new Date(v).toLocaleDateString(isZh()?'zh-CN':'en-CA',{month:'short',day:'numeric'})}catch{return ''}}

  function tabButton(id,label,count){return `<button class="content-tab ${activeTab===id?'active':''}" onclick="window.selectContentTab('${id}')"><small>${id==='draft'?'WORKING':id==='ready'?'PUBLISH PACK':'LIBRARY'}</small><strong>${label} · ${count}</strong><span>${esc(tabDesc(id))}</span></button>`;}

  function card(c,tab){
    const progress=progressFor(c,tab);const hook=String(c.hook||c.body||'').replace(/\s+/g,' ').trim();
    const side=tab==='published'?`<div class="content-card-side"><div class="content-actions-row"><button class="content-action" onclick="window.previewContent('${c.id}')">${isZh()?'查看内容':'View'}</button><button class="content-action" onclick="openContentForm('${c.id}')">${isZh()?'编辑记录':'Edit record'}</button></div></div>`:`<div class="content-card-side"><div class="content-progress"><b>${progress}%</b>${tab==='ready'?(isZh()?'发布包完成':'pack ready'):(isZh()?'完成度':'complete')}</div><div class="content-actions-row"><button class="content-action primaryish" onclick="openContentForm('${c.id}')">${tab==='ready'?(isZh()?'打开发布包':'Open publish pack'):(isZh()?'继续创作':'Continue')}</button><button class="content-action" onclick="window.previewContent('${c.id}')">${isZh()?'预览':'Preview'}</button>${tab==='ready'?`<button class="content-action" onclick="window.copyPublishPack('${c.id}')">${isZh()?'复制发布包':'Copy pack'}</button>`:''}</div></div>`;
    return `<article class="content-work-card ${tab==='published'?'published-card':''}"><div class="content-card-main"><div class="content-card-kicker"><span class="content-type">${esc(typeFor(c))}</span><span class="content-stage">${esc(txStatus(tab))}</span></div><h4>${esc(c.title||'Untitled')}</h4><p class="content-hook">${esc(hook.slice(0,260))}${hook.length>260?'…':''}</p><div class="content-meta-line"><span>${esc(c.pillar||'REDNOTE')}</span>${dateText(c)?`<span>${isZh()?'最近更新':'Updated'} ${esc(dateText(c))}</span>`:''}<span>${esc(c.source_label||c.source_type||'')}</span></div>${tab==='ready'?`<div class="content-publish-pack">${packChecks(c).map(([ok,label])=>`<div class="content-pack-item ${ok?'done':''}">${ok?'✓':'○'} ${esc(label)}</div>`).join('')}</div>`:''}${tab==='published'?`<div class="published-stats"><span>${isZh()?'已进入内容资产库':'Saved to content library'}</span>${c.published_at?`<span>${isZh()?'发布于':'Published'} ${esc(dateText(c))}</span>`:''}</div>`:''}</div>${side}</article>`;
  }

  function render(){
    if(!onContentPage())return;
    const content=document.getElementById('content');if(!content)return;
    if(content.dataset.contentStudioRendering==='1')return;
    const draft=tabRows('draft'),ready=tabRows('ready'),published=tabRows('published');
    const current=activeTab==='ready'?ready:activeTab==='published'?published:draft;
    const emptyMsg={draft:isZh()?'现在没有正在创作的内容。你跟 ChatGPT 抛出一个想法并开始成稿后，就会进入这里。':'No active drafts. Once an idea turns into an actual draft with ChatGPT, it will appear here.',ready:isZh()?'还没有发布就绪的内容。内容、标题和素材准备齐后，再放进这里。':'Nothing is publish-ready yet.',published:isZh()?'还没有已发布内容。':'No published content yet.'}[activeTab];
    content.dataset.contentStudioRendering='1';
    content.innerHTML=`<div class="content-studio-v3"><div class="content-studio-top"><div><div class="eyebrow cyan">REDNOTE CONTENT OS</div><h2>${isZh()?'小红书内容工作室':'Rednote Content Studio'}</h2><p>${isZh()?'这里不再按“灵感卡片”堆东西。只保留三个真实状态：创作中、发布就绪、已发布。':'Only three real workflow states: in progress, publish ready, and published.'}</p></div><div class="content-studio-actions"><button class="primary" onclick="openContentForm()">＋ ${isZh()?'新建内容':'New content'}</button></div></div><div class="content-pipeline">${tabButton('draft',txStatus('draft'),draft.length)}${tabButton('ready',txStatus('ready'),ready.length)}${tabButton('published',txStatus('published'),published.length)}</div><div class="content-section-head"><div><div class="eyebrow">${activeTab==='draft'?'WORKING':activeTab==='ready'?'PUBLISH QUEUE':'CONTENT LIBRARY'}</div><h3>${esc(txStatus(activeTab))}</h3></div><span>${current.length} ${isZh()?'条内容':'items'}</span></div><div class="content-list">${current.length?current.map(c=>card(c,activeTab)).join(''):`<div class="content-empty"><strong>${esc(txStatus(activeTab))}</strong>${esc(emptyMsg)}</div>`}</div></div>`;
    delete content.dataset.contentStudioRendering;
    const model=document.getElementById('modelBtn');if(model)model.textContent=isZh()?'ChatGPT · 内容增长经理':'ChatGPT · Content & Growth Manager';
  }

  window.selectContentTab=tab=>{activeTab=tab;localStorage.setItem('studio_content_tab',tab);render();};
  window.previewContent=id=>{const c=rows().find(x=>x.id===id);if(!c)return;const m=document.getElementById('modal');if(!m)return;m.classList.remove('hidden');m.innerHTML=`<div class="modal-card glass content-preview-modal"><div class="eyebrow cyan">${isZh()?'内容预览':'CONTENT PREVIEW'}</div><h2>${esc(c.title||'Untitled')}</h2>${c.hook?`<p class="subtle">${esc(c.hook)}</p>`:''}<div class="content-preview-body">${esc(c.body||c.hook||'')}</div><div class="modal-actions"><button class="ghost" onclick="closeModal()">${isZh()?'关闭':'Close'}</button><button class="primary" onclick="closeModal();openContentForm('${c.id}')">${isZh()?'继续创作':'Continue'}</button></div></div>`;};
  window.copyPublishPack=async id=>{const c=rows().find(x=>x.id===id);if(!c)return;const text=`${c.title||''}\n\n${c.body||c.hook||''}`.trim();try{await navigator.clipboard.writeText(text);const t=document.createElement('div');t.className='content-copy-toast';t.textContent=isZh()?'已复制标题 + 正文，可直接去小红书粘贴':'Title + copy copied';document.body.appendChild(t);setTimeout(()=>t.remove(),1800)}catch{alert(isZh()?'复制失败，请打开发布包手动复制':'Copy failed; open the publish pack and copy manually')}};
  window.refreshContentStudio=render;

  const obs=new MutationObserver(()=>{if(onContentPage()&&!document.querySelector('.content-studio-v3'))setTimeout(render,20);});
  window.addEventListener('load',()=>{const c=document.getElementById('content');if(c)obs.observe(c,{childList:true,subtree:false});setTimeout(render,500);});
})();
(()=>{
  const zh=()=>String(window.lang||localStorage.getItem('studio_lang')||'zh')==='zh';
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const students=()=>window.STUDIO_DATA?.students||[];
  const seedGroups=()=>{
    const by=n=>students().find(s=>s.name?.toLowerCase()===n.toLowerCase());
    const defs=[['Ryan & Spencer',['Ryan','Spencer'],1.5,120],['Marcos & Mason',['Marcos','Mason'],1.5,150]];
    return defs.map((d,i)=>({id:'seed-'+i,name:d[0],studentIds:d[1].map(n=>by(n)?.dbId).filter(Boolean),duration:d[2],revenue:d[3],expense:null}));
  };
  const state={date:null,mode:'group',subject:'',groups:seedGroups(),selectedGroup:'',start:'10:00',end:'11:30',revenue:'',expense:'',actualExpense:'',notes:'',drafts:[]};
  const day=v=>{const d=new Date(v);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
  const fmt=v=>new Date(v).toLocaleDateString(zh()?'zh-CN':'en-CA',{month:'short',day:'numeric'});
  const time=v=>new Date(v).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  const duration=()=>{if(!state.start||!state.end)return 0;const [a,b]=state.start.split(':').map(Number),[c,d]=state.end.split(':').map(Number);return Math.max(0,((c*60+d)-(a*60+b))/60)};
  const allEvents=()=>[...(window.STUDIO_EXT?.calendarEvents||[]),...state.drafts];
  function groupOptions(){return state.groups.map(g=>'<option value="'+esc(g.id)+'" '+(state.selectedGroup===g.id?'selected':'')+'>'+esc(g.name)+'</option>').join('');}
  function studentOptions(){return students().map(s=>'<option value="'+esc(s.dbId||s.id)+'" '+(state.subject===(s.dbId||s.id)?'selected':'')+'>'+esc(s.name)+'</option>').join('');}
  function form(){
    const g=state.groups.find(x=>x.id===state.selectedGroup);
    return '<aside class="ops2-quick glass"><div class="eyebrow cyan">'+(zh()?'快速排课':'QUICK ADD')+'</div><h3>'+(zh()?'新增课程':'Add lesson')+'</h3>'
      +'<label>'+(zh()?'日期':'Date')+'<input id="o2date" type="date" value="'+esc(state.date||day(new Date()))+'" onchange="ops2Set(\'date\',this.value)"></label>'
      +'<div class="ops2-two"><label>'+(zh()?'开始':'Start')+'<input type="time" value="'+state.start+'" onchange="ops2Set(\'start\',this.value)"></label><label>'+(zh()?'结束':'End')+'<input type="time" value="'+state.end+'" onchange="ops2Set(\'end\',this.value)"></label></div>'
      +'<div class="ops2-duration">'+duration().toFixed(2)+' h</div>'
      +'<div class="ops2-seg"><button class="'+(state.mode==='solo'?'active':'')+'" onclick="ops2Mode(\'solo\')">1-on-1</button><button class="'+(state.mode==='group'?'active':'')+'" onclick="ops2Mode(\'group\')">'+(zh()?'班组':'Group')+'</button></div>'
      +(state.mode==='solo'?'<label>'+(zh()?'学生':'Student')+'<select onchange="ops2Subject(this.value)"><option value="">—</option>'+studentOptions()+'</select></label>':'<label>'+(zh()?'班组':'Group')+'<select onchange="ops2Group(this.value)"><option value="">—</option>'+groupOptions()+'</select></label><button class="ops2-link" onclick="ops2NewGroup()">＋ '+(zh()?'新建 / 组合学生':'Create / combine students')+'</button>')
      +'<div class="ops2-money"><label>'+(zh()?'课程收入':'Revenue')+'<div><span>$</span><input type="number" step=".01" value="'+esc(state.revenue)+'" onchange="ops2Set(\'revenue\',this.value)"></div></label><label>'+(zh()?'预计支出':'Expected expense')+'<div><span>$</span><input type="number" step=".01" value="'+esc(state.expense)+'" onchange="ops2Set(\'expense\',this.value)"></div></label></div>'
      +'<label>'+(zh()?'备注':'Notes')+'<textarea onchange="ops2Set(\'notes\',this.value)">'+esc(state.notes)+'</textarea></label>'
      +'<button class="primary ops2-save" onclick="ops2SaveDraft()">'+(zh()?'保存预览课程':'Save preview lesson')+'</button>'
      +'<p class="ops2-preview-note">'+(zh()?'Preview 模式：这里的保存只存在当前浏览器，不会写入正式数据库。':'Preview mode: saves stay in this browser and never touch production data.')+'</p></aside>';
  }
  function grid(){
    const now=new Date(),cursor=window.ops2Cursor||new Date(now.getFullYear(),now.getMonth(),1),y=cursor.getFullYear(),m=cursor.getMonth(),first=new Date(y,m,1),offset=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),prev=new Date(y,m,0).getDate(),cells=[];
    for(let i=0;i<42;i++){let n,mm=m,yy=y,muted=false;if(i<offset){n=prev-offset+i+1;mm=m-1;muted=true}else if(i>=offset+days){n=i-offset-days+1;mm=m+1;muted=true}else n=i-offset+1;const dt=new Date(yy,mm,n),ds=day(dt);const ev=allEvents().filter(e=>day(e.start_at)===ds&&e.status!=='cancelled');cells.push('<button class="ops2-day '+(muted?'muted ':'')+(ds===day(now)?'today ':'')+'" onclick="ops2PickDate(\''+ds+'\')"><span>'+n+'</span>'+ev.slice(0,3).map(e=>'<i>'+time(e.start_at)+' '+esc(e.title)+'</i>').join('')+(ev.length>3?'<small>+'+(ev.length-3)+'</small>':'')+'</button>')}
    return '<section class="ops2-cal glass"><div class="ops2-calhead"><button onclick="ops2Shift(-1)">‹</button><h3>'+cursor.toLocaleDateString(zh()?'zh-CN':'en-CA',{year:'numeric',month:'long'})+'</h3><button onclick="ops2Shift(1)">›</button></div><div class="ops2-week">'+(zh()?['一','二','三','四','五','六','日']:['Mon','Tue','Wed','Thu','Fri','Sat','Sun']).map(x=>'<span>'+x+'</span>').join('')+'</div><div class="ops2-grid">'+cells.join('')+'</div></section>';
  }
  function upcoming(){
    const rows=allEvents().filter(e=>new Date(e.start_at)>=new Date()&&e.status!=='cancelled').sort((a,b)=>new Date(a.start_at)-new Date(b.start_at)).slice(0,5);
    return '<div class="ops2-upcoming"><div><div class="eyebrow">'+(zh()?'接下来':'UPCOMING')+'</div><h3>'+(zh()?'最近课程':'Next lessons')+'</h3></div><div class="ops2-up-list">'+rows.map(e=>'<article><b>'+esc(e.title)+'</b><span>'+fmt(e.start_at)+' · '+time(e.start_at)+'</span></article>').join('')+'</div></div>';
  }
  function render(){
    const c=document.getElementById('content');if(!c)return;
    const t=document.getElementById('pageTitle');if(t)t.textContent=zh()?'课程日历 · Ops V2 Preview':'Course Calendar · Ops V2 Preview';
    c.innerHTML='<div class="ops2-page"><div class="ops2-head"><div><div class="eyebrow cyan">OPS V2 · SAFE PREVIEW</div><h2>'+(zh()?'排课就是运营入口':'Scheduling becomes the operations entry point')+'</h2><p>'+(zh()?'课程只录一次；未来由同一个 Lesson Session 驱动日历、收支与报表。':'Enter a lesson once; one Lesson Session will drive calendar, finance and reporting.')+'</p></div><span class="ops2-safe">Preview · production untouched</span></div><div class="ops2-layout">'+grid()+form()+'</div>'+upcoming()+'</div>';
  }
  const oldGo=window.go;window.go=function(p){if(p==='calendar'){try{if(typeof current!=='undefined')current='calendar'}catch(e){};render();return;}return oldGo(p)};
  window.ops2PickDate=d=>{state.date=d;render()};
  window.ops2Shift=n=>{const c=window.ops2Cursor||new Date();window.ops2Cursor=new Date(c.getFullYear(),c.getMonth()+n,1);render()};
  window.ops2Set=(k,v)=>{state[k]=v;render()};
  window.ops2Mode=m=>{state.mode=m;state.subject='';render()};
  window.ops2Subject=v=>{state.subject=v};
  window.ops2Group=v=>{state.selectedGroup=v;const g=state.groups.find(x=>x.id===v);if(g){state.revenue=g.revenue??'';state.expense=g.expense??'';const h=g.duration||1.5;const [hh,mm]=state.start.split(':').map(Number),end=hh*60+mm+Math.round(h*60);state.end=String(Math.floor(end/60)%24).padStart(2,'0')+':'+String(end%60).padStart(2,'0')}render()};
  window.ops2NewGroup=()=>{const names=prompt(zh()?'输入新班组名称，例如 Alice & Ryan':'New group name, e.g. Alice & Ryan');if(!names)return;const g={id:'local-'+Date.now(),name:names,studentIds:[],duration:1.5,revenue:'',expense:''};state.groups.push(g);state.selectedGroup=g.id;render()};
  window.ops2SaveDraft=()=>{const date=state.date||day(new Date()),label=state.mode==='group'?(state.groups.find(x=>x.id===state.selectedGroup)?.name||'Group'):(students().find(s=>(s.dbId||s.id)===state.subject)?.name||'1-on-1');if(!state.subject&&!state.selectedGroup){alert(zh()?'请选择学生或班组':'Choose a student or group');return;}state.drafts.push({id:'preview-'+Date.now(),title:label,start_at:new Date(date+'T'+state.start).toISOString(),end_at:new Date(date+'T'+state.end).toISOString(),event_type:'lesson',status:'scheduled',preview:true,revenue:Number(state.revenue||0),expected_expense:Number(state.expense||0)});alert(zh()?'已加入 Preview 日历。没有写入正式数据库。':'Added to preview calendar. Production data was not changed.');render()};
})();
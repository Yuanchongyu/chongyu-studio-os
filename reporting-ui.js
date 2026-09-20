(()=>{
  const S={data:null,month:null,week:null,cohort:null,from:null,to:null};
  const zh=()=>String(window.lang||localStorage.getItem('studio_lang')||'zh')==='zh';
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
  const money=v=>Number(v||0).toLocaleString(zh()?'zh-CN':'en-CA',{minimumFractionDigits:2,maximumFractionDigits:2});
  const api=async(action,payload={})=>{const r=await fetch('/api/ops',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'finance_'+action,payload})});const d=await r.json().catch(()=>({}));if(r.status===423)return {locked:true};if(!r.ok)throw new Error(d.error||('HTTP '+r.status));return d;};

  const style=document.createElement('style');
  style.textContent='.report-page{max-width:1420px;margin:0 auto}.report-lock{max-width:520px;margin:80px auto;padding:38px;text-align:center}.report-lock .lock-icon{width:66px;height:66px;border-radius:22px;margin:0 auto 18px;display:grid;place-items:center;font-size:30px;background:linear-gradient(135deg,#e7f8ff,#eef0ff);border:1px solid #cde7fb}.report-lock h2{margin:0 0 8px}.report-lock p{color:#6d829c;margin:0 0 24px}.report-pin-row{display:flex;gap:10px}.report-pin-row input{flex:1;font-size:20px;letter-spacing:.18em;text-align:center}.report-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px}.report-head h2{margin:2px 0 5px;font-size:30px}.report-head p{margin:0;color:#6c8198}.report-breadcrumb{display:flex;gap:7px;flex-wrap:wrap;margin:14px 0 20px}.report-breadcrumb button{border:1px solid #d9e7f2;background:#fff;border-radius:999px;padding:7px 11px;color:#53708c;font-weight:800;cursor:pointer}.report-breadcrumb button.active{background:#eaf5ff;color:#0f6fb8;border-color:#c6e1f5}.report-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin:18px 0 24px}.report-kpi{padding:20px;border-radius:20px;background:#fff;border:1px solid #e0ebf5;box-shadow:0 12px 28px rgba(49,85,123,.06)}.report-kpi small{display:block;color:#758aa2;font-weight:850;font-size:11px;margin-bottom:7px}.report-kpi strong{display:block;color:#173b5b;font-size:27px}.report-kpi.net strong{color:#087a63}.report-section{margin:24px 0}.report-section-head{display:flex;justify-content:space-between;align-items:end;gap:12px;margin:0 0 12px}.report-section-head h3{margin:3px 0 0;font-size:20px}.report-section-head p{margin:0;color:#7a8fa5;font-size:13px}.report-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.report-card{display:block;width:100%;text-align:left;border:1px solid #dfeaf4;background:#fff;border-radius:20px;padding:18px;cursor:pointer;box-shadow:0 10px 24px rgba(49,85,123,.05);color:inherit}.report-card:hover{transform:translateY(-1px);border-color:#bcd9ef}.report-card .top{display:flex;justify-content:space-between;gap:10px;align-items:center}.report-card h4{margin:0;font-size:17px;color:#173b5b}.report-card .meta{font-size:12px;color:#7890a7;font-weight:800}.report-card .nums{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}.report-card .nums span{font-size:11px;color:#8295a8}.report-card .nums b{display:block;margin-top:3px;color:#274861;font-size:15px}.report-bar{height:7px;background:#edf4f8;border-radius:999px;overflow:hidden;margin-top:14px}.report-bar i{display:block;height:100%;background:linear-gradient(90deg,#43a9e7,#5fd0b2);border-radius:999px}.report-cohorts{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.cohort-card{border:1px solid #dfeaf4;background:#fff;border-radius:20px;padding:18px;cursor:pointer;text-align:left;color:inherit}.cohort-card:hover{border-color:#bcd9ef}.cohort-card .cohort-title{display:flex;justify-content:space-between;gap:12px}.cohort-card h4{margin:0;color:#173b5b}.cohort-card .lesson-count{background:#edf7ff;color:#1170b6;border-radius:999px;padding:5px 9px;font-size:12px;font-weight:850}.cohort-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px}.cohort-metrics span{font-size:11px;color:#8195a8}.cohort-metrics b{display:block;margin-top:3px;color:#294861}.report-table-wrap{overflow:auto;border-radius:20px;border:1px solid #e0ebf5;background:#fff}.report-table{width:100%;border-collapse:collapse;min-width:900px}.report-table th{padding:13px 15px;text-align:left;font-size:11px;color:#6b8098;background:#f6faff;border-bottom:1px solid #e3edf6}.report-table td{padding:14px 15px;border-bottom:1px solid #edf3f8;color:#27445f}.report-table tr:last-child td{border-bottom:0}.report-net{font-weight:900;color:#087a63}.report-expense{color:#b94d45;font-weight:800}.report-pill{display:inline-flex;padding:5px 9px;border-radius:999px;background:#eef6fc;color:#4b6985;font-size:11px;font-weight:850}.report-unallocated{margin-top:14px;padding:16px 18px;border:1px dashed #d8e5ef;background:#fbfdff;border-radius:16px;color:#657d94}.report-unallocated b{color:#35536f}.report-empty{padding:36px;text-align:center;color:#8092a5}@media(max-width:1100px){.report-kpis{grid-template-columns:repeat(2,1fr)}.report-grid{grid-template-columns:1fr 1fr}.report-cohorts{grid-template-columns:1fr}}@media(max-width:800px){.report-grid{grid-template-columns:1fr}.report-kpis{grid-template-columns:1fr 1fr}.cohort-metrics{grid-template-columns:1fr 1fr}.report-head{flex-direction:column}}';
  document.head.appendChild(style);
  const enhance=document.createElement('style');
  enhance.textContent='.report-filters{display:grid;grid-template-columns:1.1fr 1.1fr 1.45fr auto;gap:12px;align-items:end;margin:18px 0 12px;padding:16px 18px;border:1px solid #dfeaf4;background:rgba(255,255,255,.82);border-radius:20px;box-shadow:0 8px 24px rgba(49,85,123,.04)}.report-filter label{display:block;font-size:11px;color:#738aa1;font-weight:850;margin-bottom:7px}.report-filter select{width:100%;border:1px solid #d8e5f0;border-radius:12px;padding:10px 12px;background:#fff;color:#173b5b;font:inherit}.report-filter input{width:100%;box-sizing:border-box;border:1px solid #d8e5f0;border-radius:12px;padding:9px 12px;background:#fff;color:#173b5b;font:inherit}.report-filter select:disabled{opacity:.5}.report-filter-actions{display:flex;gap:7px;flex-wrap:wrap}.report-kpis{grid-template-columns:repeat(6,1fr)!important;margin-bottom:10px!important}.report-kpi strong{font-size:25px!important}.report-kpi .sub{display:block;margin-top:6px;color:#8a9caf;font-size:10px;font-weight:700;line-height:1.35}.report-quality{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 24px;color:#6f859b;font-size:12px}.report-quality span{display:inline-flex;align-items:center;padding:6px 9px;border-radius:999px;background:#f1f7fb;border:1px solid #e1edf6}@media(max-width:1250px){.report-kpis{grid-template-columns:repeat(3,1fr)!important}}@media(max-width:1000px){.report-filters{grid-template-columns:1fr 1fr}}@media(max-width:800px){.report-filters{grid-template-columns:1fr}.report-kpis{grid-template-columns:1fr 1fr!important}}';
  document.head.appendChild(enhance);

  function patchNav(){
    const nav=document.getElementById('nav'); if(!nav||nav.querySelector('[data-report-nav]')) return;
    const fin=nav.querySelector('[data-finance-nav].nav-item');
    if(!fin) return;
    const section=nav.querySelector('[data-finance-nav].nav-section'); if(section) section.textContent=zh()?'运营':'OPERATIONS';
    const b=document.createElement('button');
    b.className='nav-item '+((typeof current!=='undefined'&&current==='reporting')?'active':'');
    b.dataset.reportNav='1';
    b.innerHTML='<span class="nav-icon">▥</span><span>'+(zh()?'报表分析':'Reporting')+'</span>';
    b.onclick=()=>window.go('reporting');
    fin.insertAdjacentElement('afterend',b);
  }

  function setChrome(){
    const t=document.getElementById('pageTitle'); if(t)t.textContent=zh()?'经营报表':'Reporting';
    const w=document.getElementById('workspaceLabel'); if(w)w.textContent=zh()?'创始人控制台 · 私密':'Founder Control Deck · Private';
    patchNav();
    document.querySelectorAll('#nav .nav-item').forEach(x=>x.classList.remove('active'));
    document.querySelector('#nav [data-report-nav]')?.classList.add('active');
  }

  function lockView(){
    return '<div class="report-page"><section class="report-lock glass"><div class="lock-icon">🔐</div><div class="eyebrow cyan">PRIVATE BUSINESS REPORTING</div><h2>'+(zh()?'经营报表已锁定':'Reporting is locked')+'</h2><p>'+(zh()?'和收支系统共用财务密码。解锁后可查看按月、按周、按学生和每节课的收入与支出。':'Uses the same finance PIN. Unlock to drill down by month, week, student and lesson.')+'</p><div class="report-pin-row"><input id="reportPin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="••••••" onkeydown="if(event.key===\'Enter\')reportUnlock()"><button class="primary" onclick="reportUnlock()">'+(zh()?'解锁':'Unlock')+'</button></div></section></div>';
  }

  const dateObj=v=>new Date(String(v)+'T12:00:00');
  const dateKey=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const monthKey=v=>String(v||'').slice(0,7);
  const dayKey=v=>String(v||'').slice(0,10);
  const endOfMonth=m=>{const [y,mo]=String(m).split('-').map(Number);return dateKey(new Date(y,mo,0));};
  const inRange=(v,from=S.from,to=S.to)=>{const d=dayKey(v);return (!from||d>=from)&&(!to||d<=to);};
  const weekKey=v=>{const d=dateObj(v),n=(d.getDay()+6)%7;d.setDate(d.getDate()-n);return dateKey(d);};
  const monthLabel=m=>new Date(m+'-15T12:00:00').toLocaleDateString(zh()?'zh-CN':'en-CA',{year:'numeric',month:'long'});
  const weekLabel=w=>{const a=dateObj(w),b=new Date(a);b.setDate(a.getDate()+6);return a.toLocaleDateString(zh()?'zh-CN':'en-CA',{month:'short',day:'numeric'})+' – '+b.toLocaleDateString(zh()?'zh-CN':'en-CA',{month:'short',day:'numeric'});};
  function zhNum(s){const m={一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9,十:10};if(m[s])return m[s];if(s&&s[0]==='十')return 10+(m[s[1]]||0);if(s&&s.endsWith('十'))return (m[s[0]]||0)*10;return 1;}
  function lessonUnits(desc){
    const t=String(desc||''),en=t.match(/\b(\d+)\s*(?:lessons|classes)\b/i); if(en)return Math.max(1,Number(en[1]));
    const cm=t.match(/(^|[^第])([一二两三四五六七八九十]+)节课/); return cm?zhNum(cm[2]):1;
  }
  function cohortName(desc){
    const raw=String(desc||'').trim(),t=raw.toLowerCase();
    if(/ryan/.test(t)&&/(spenser|spencer)/.test(t))return 'Ryan & Spencer';
    if(/marcos/.test(t)&&/mason/.test(t))return 'Marcos & Mason';
    if(/ainfinit/i.test(raw))return 'AInfinit';
    const known=['Ryan','Spencer','Spenser','Marcos','Mason'];
    const found=known.filter(n=>new RegExp('\\b'+n+'\\b','i').test(raw)).map(n=>n==='Spenser'?'Spencer':n);
    if(found.length)return [...new Set(found)].join(' & ');
    return zh()?'未归属课程':'Unassigned lessons';
  }

  function model(){
    const tx=S.data?.transactions||[], lessonIncome=tx.filter(x=>x.direction==='income'&&x.category==='lesson');
    const byDate=new Map(); lessonIncome.forEach(x=>{const a=byDate.get(x.txn_date)||[];a.push(x);byDate.set(x.txn_date,a);});
    const direct=new Map(),overhead=[];
    tx.filter(x=>x.direction==='expense').forEach(e=>{const ls=byDate.get(e.txn_date)||[];if(e.category==='transport'&&ls.length===1){const a=direct.get(ls[0].id)||[];a.push(e);direct.set(ls[0].id,a);}else overhead.push(e);});
    const lessons=lessonIncome.map(x=>{const ex=direct.get(x.id)||[],cost=ex.reduce((s,e)=>s+Number(e.amount||0),0),inc=Number(x.amount||0);return {id:x.id,date:x.txn_date,month:monthKey(x.txn_date),week:weekKey(x.txn_date),cohort:cohortName(x.description),description:x.description||cohortName(x.description),hours:Number(x.hours||0),units:lessonUnits(x.description),income:inc,directExpense:cost,net:inc-cost};});
    return {tx,lessons,overhead};
  }

  const inPeriod=(x)=>{const d=x.txn_date||x.date;return inRange(d)&&(!S.month||monthKey(d)===S.month)&&(!S.week||weekKey(d)===S.week);};
  function scopeFor(m,month=S.month,week=S.week,cohort=S.cohort,from=S.from,to=S.to){
    const tx=m.tx.filter(x=>inRange(x.txn_date,from,to)&&(!month||monthKey(x.txn_date)===month)&&(!week||weekKey(x.txn_date)===week));
    const allLessons=m.lessons.filter(x=>inRange(x.date,from,to)&&(!month||x.month===month)&&(!week||x.week===week));
    const lessons=cohort?allLessons.filter(x=>x.cohort===cohort):allLessons;
    const income=cohort?lessons.reduce((s,x)=>s+x.income,0):tx.filter(x=>x.direction==='income').reduce((s,x)=>s+Number(x.amount||0),0);
    const expense=cohort?lessons.reduce((s,x)=>s+x.directExpense,0):tx.filter(x=>x.direction==='expense').reduce((s,x)=>s+Number(x.amount||0),0);
    const units=lessons.reduce((s,x)=>s+x.units,0);
    const hours=lessons.reduce((s,x)=>s+x.hours,0);
    const directExpense=lessons.reduce((s,x)=>s+x.directExpense,0);
    const hourlyRows=lessons.filter(x=>x.hours>0);
    const hourlyHours=hourlyRows.reduce((s,x)=>s+x.hours,0);
    const hourlyIncome=hourlyRows.reduce((s,x)=>s+x.income,0);
    const hourlyNet=hourlyRows.reduce((s,x)=>s+x.net,0);
    const coveredUnits=hourlyRows.reduce((s,x)=>s+x.units,0);
    return {income,expense,net:income-expense,units,hours,directExpense,
      avgRevenueHour:hourlyHours?hourlyIncome/hourlyHours:null,
      avgNetHour:hourlyHours?hourlyNet/hourlyHours:null,
      avgExpenseLesson:units?expense/units:null,
      avgDirectExpenseLesson:units?directExpense/units:null,
      hourCoverage:units?coveredUnits/units:0,missingHourUnits:Math.max(0,units-coveredUnits)};
  }
  function scope(m){return scopeFor(m);}
  function sums(rows){const income=rows.filter(x=>x.direction==='income').reduce((s,x)=>s+Number(x.amount||0),0),expense=rows.filter(x=>x.direction==='expense').reduce((s,x)=>s+Number(x.amount||0),0);return {income,expense,net:income-expense};}
  function cohortStats(lessons){const q=new Map();lessons.forEach(x=>{const a=q.get(x.cohort)||{name:x.cohort,units:0,hours:0,income:0,expense:0,net:0};a.units+=x.units;a.hours+=x.hours;a.income+=x.income;a.expense+=x.directExpense;a.net+=x.net;q.set(x.cohort,a);});return [...q.values()].sort((a,b)=>b.income-a.income);}

  function filterBar(m){
    const cohorts=[...new Set(m.lessons.map(x=>x.cohort))].sort((x,y)=>x.localeCompare(y));
    let out='<div class="report-filters">';
    out+='<div class="report-filter"><label>'+(zh()?'开始日期':'FROM')+'</label><input type="date" value="'+esc(S.from||'')+'" onchange="reportFilterFrom(this.value)"></div>';
    out+='<div class="report-filter"><label>'+(zh()?'结束日期':'TO')+'</label><input type="date" value="'+esc(S.to||'')+'" onchange="reportFilterTo(this.value)"></div>';
    out+='<div class="report-filter"><label>'+(zh()?'学生 / 班组':'STUDENT / COHORT')+'</label><select onchange="reportFilterCohort(this.value)"><option value="">'+(zh()?'全部学生 / 班组':'All students / cohorts')+'</option>'+cohorts.map(x=>'<option value="'+encodeURIComponent(x)+'" '+(S.cohort===x?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></div>';
    out+='<div class="report-filter-actions"><button class="ghost" onclick="reportThisWeek()">'+(zh()?'本周':'This week')+'</button><button class="ghost" onclick="reportThisMonth()">'+(zh()?'本月':'This month')+'</button><button class="ghost" onclick="reportLast30()">'+(zh()?'近30天':'30 days')+'</button><button class="ghost" onclick="reportReset()">'+(zh()?'重置':'Reset')+'</button></div>';
    return out+'</div>';
  }
  function kpis(s){
    const gross=s.avgRevenueHour==null?'—':('$'+money(s.avgRevenueHour));
    const netHour=s.avgNetHour==null?'—':('$'+money(s.avgNetHour));
    const avgExpense=s.avgExpenseLesson==null?'—':('$'+money(s.avgExpenseLesson));
    const avgDirect=s.avgDirectExpenseLesson==null?'—':('$'+money(s.avgDirectExpenseLesson));
    return '<div class="report-kpis">'
      +'<div class="report-kpi"><small>'+(zh()?'总课程数':'LESSONS')+'</small><strong>'+s.units+'</strong></div>'
      +'<div class="report-kpi"><small>'+(zh()?'教学总时长':'TEACHING HOURS')+'</small><strong>'+money(s.hours)+' h</strong></div>'
      +'<div class="report-kpi"><small>'+(zh()?'课程收入':'REVENUE')+'</small><strong>$'+money(s.income)+'</strong></div>'
      +'<div class="report-kpi net"><small>'+(zh()?'课程净额':'NET')+'</small><strong>$'+money(s.net)+'</strong></div>'
      +'<div class="report-kpi"><small>'+(zh()?'平均收入 / 小时':'AVG REVENUE / HOUR')+'</small><strong>'+gross+'</strong><span class="sub">'+(zh()?'净时薪 '+netHour+' / h':'Net '+netHour+' / h')+'</span></div>'
      +'<div class="report-kpi"><small>'+(zh()?'平均支出 / 节':'AVG EXPENSE / LESSON')+'</small><strong>'+avgExpense+'</strong><span class="sub">'+(zh()?'其中直接支出 '+avgDirect+' / 节':'Direct '+avgDirect+' / lesson')+'</span></div>'
      +'</div>'
      +'<div class="report-quality"><span>'+(zh()?'课时覆盖':'Hour coverage')+' · '+Math.round(s.hourCoverage*100)+'%</span>'
      +(s.missingHourUnits?'<span>⚠ '+s.missingHourUnits+' '+(zh()?'节课缺少时长':'lessons missing duration')+'</span>':'<span>✓ '+(zh()?'课程时长完整':'Duration data complete')+'</span>')
      +'</div>';
  }
  function monthCards(m){
    const months=[...new Set(m.tx.map(x=>monthKey(x.txn_date)))].sort().reverse(); if(!months.length)return '';
    const max=Math.max(...months.map(k=>sums(m.tx.filter(x=>monthKey(x.txn_date)===k)).income),1);
    return '<section class="report-section"><div class="report-section-head"><div><div class="eyebrow cyan">'+(zh()?'按月':'MONTHLY')+'</div><h3>'+(zh()?'月度经营表现':'Monthly performance')+'</h3></div><p>'+(zh()?'点击月份继续下钻':'Click a month to drill down')+'</p></div><div class="report-grid">'+months.map(k=>{const s=sums(m.tx.filter(x=>monthKey(x.txn_date)===k)),u=m.lessons.filter(x=>x.month===k).reduce((n,x)=>n+x.units,0);return '<button class="report-card" onclick="reportSetMonth(\''+k+'\')"><div class="top"><h4>'+esc(monthLabel(k))+'</h4><span class="meta">'+u+' '+(zh()?'节课':'lessons')+'</span></div><div class="nums"><div><span>'+(zh()?'收入':'Income')+'</span><b>$'+money(s.income)+'</b></div><div><span>'+(zh()?'支出':'Expense')+'</span><b>$'+money(s.expense)+'</b></div><div><span>'+(zh()?'净额':'Net')+'</span><b>$'+money(s.net)+'</b></div></div><div class="report-bar"><i style="width:'+Math.max(5,s.income/max*100)+'%"></i></div></button>';}).join('')+'</div></section>';
  }
  function weekCards(m){
    if(!S.month)return ''; const weeks=[...new Set(m.tx.filter(x=>monthKey(x.txn_date)===S.month).map(x=>weekKey(x.txn_date)))].sort().reverse();
    return '<section class="report-section"><div class="report-section-head"><div><div class="eyebrow cyan">'+(zh()?'按周':'WEEKLY')+'</div><h3>'+(zh()?'周度拆分':'Weekly breakdown')+'</h3></div><p>'+(zh()?'点击某一周继续下钻':'Click a week to drill down')+'</p></div><div class="report-grid">'+weeks.map(w=>{const s=sums(m.tx.filter(x=>monthKey(x.txn_date)===S.month&&weekKey(x.txn_date)===w)),u=m.lessons.filter(x=>x.month===S.month&&x.week===w).reduce((n,x)=>n+x.units,0);return '<button class="report-card" onclick="reportSetWeek(\''+w+'\')"><div class="top"><h4>'+esc(weekLabel(w))+'</h4><span class="meta">'+u+' '+(zh()?'节课':'lessons')+'</span></div><div class="nums"><div><span>'+(zh()?'收入':'Income')+'</span><b>$'+money(s.income)+'</b></div><div><span>'+(zh()?'支出':'Expense')+'</span><b>$'+money(s.expense)+'</b></div><div><span>'+(zh()?'净额':'Net')+'</span><b>$'+money(s.net)+'</b></div></div></button>';}).join('')+'</div></section>';
  }
  function cohortCards(m){
    const base=m.lessons.filter(inPeriod).filter(x=>!S.cohort||x.cohort===S.cohort),stats=cohortStats(base); if(!stats.length)return '';
    return '<section class="report-section"><div class="report-section-head"><div><div class="eyebrow cyan">'+(zh()?'学生 / 班组':'STUDENT / COHORT')+'</div><h3>'+(zh()?'按学生或组合查看':'Performance by student / cohort')+'</h3></div><p>'+(zh()?'点击后查看每一节课':'Click to inspect individual lessons')+'</p></div><div class="report-cohorts">'+stats.map(x=>{const key=encodeURIComponent(x.name);return '<button class="cohort-card" onclick="reportSetCohort(decodeURIComponent(\''+key+'\'))"><div class="cohort-title"><h4>'+esc(x.name)+'</h4><span class="lesson-count">'+x.units+' '+(zh()?'节':'lessons')+'</span></div><div class="cohort-metrics"><div><span>'+(zh()?'收入':'Income')+'</span><b>$'+money(x.income)+'</b></div><div><span>'+(zh()?'直接支出':'Direct expense')+'</span><b>$'+money(x.expense)+'</b></div><div><span>'+(zh()?'课程净额':'Lesson net')+'</span><b>$'+money(x.net)+'</b></div><div><span>'+(zh()?'平均/节':'Avg / lesson')+'</span><b>$'+money(x.units?x.net/x.units:0)+'</b></div></div></button>';}).join('')+'</div></section>';
  }
  function lessonLedger(m){
    const rows=m.lessons.filter(inPeriod).filter(x=>!S.cohort||x.cohort===S.cohort); if(!rows.length)return '';
    return '<section class="report-section"><div class="report-section-head"><div><div class="eyebrow cyan">'+(zh()?'课程明细':'LESSON LEDGER')+'</div><h3>'+(S.cohort?esc(S.cohort):(zh()?'每节课收入 / 支出':'Income and expense per lesson'))+'</h3></div><p>'+(zh()?'同日只有一节课时，交通费会自动归到该节课':'Same-day transport is attached only when the lesson match is unambiguous')+'</p></div><div class="report-table-wrap"><table class="report-table"><thead><tr><th>'+(zh()?'日期':'Date')+'</th><th>'+(zh()?'课程':'Lesson')+'</th><th>'+(zh()?'归属':'Cohort')+'</th><th>'+(zh()?'课时':'Hours')+'</th><th>'+(zh()?'收入':'Income')+'</th><th>'+(zh()?'直接支出':'Direct expense')+'</th><th>'+(zh()?'净额':'Net')+'</th></tr></thead><tbody>'+rows.map(x=>'<tr><td>'+esc(x.date)+'</td><td>'+esc(x.description)+'</td><td><span class="report-pill">'+esc(x.cohort)+'</span></td><td>'+(x.hours?money(x.hours)+' h':'—')+'</td><td>+$'+money(x.income)+'</td><td class="report-expense">'+(x.directExpense?'−$'+money(x.directExpense):'—')+'</td><td class="report-net">$'+money(x.net)+'</td></tr>').join('')+'</tbody></table></div></section>';
  }
  function overhead(m){
    if(S.cohort)return ''; const rows=m.overhead.filter(inPeriod); if(!rows.length)return ''; const total=rows.reduce((s,x)=>s+Number(x.amount||0),0);
    return '<div class="report-unallocated"><b>'+(zh()?'未分配 / 运营支出':'Unallocated / operating expenses')+' · $'+money(total)+'</b><br><span>'+(zh()?'设备、软件等不会自动塞进某个学生；同一天如果有多节课，交通费也不会猜测归属。':'Equipment and software stay as overhead; transport is not guessed when several lessons happen on the same day.')+'</span></div>';
  }
  function view(){
    const m=model(),s=scope(m);
    let h='<div class="report-page"><div class="report-head"><div><div class="eyebrow cyan">BUSINESS REPORTING</div><h2>'+(zh()?'经营分析 · 可下钻':'Business reporting · drill down')+'</h2><p>'+(zh()?'月份 → 周 → 学生/班组 → 每节课，查看收入、支出和净额。':'Month → week → student/cohort → lesson, with income, expense and net.')+'</p></div><span class="finance-secure">🔒 '+(zh()?'已解锁':'Unlocked')+'</span></div>'+filterBar(m)+kpis(s);
    if(!S.month)h+=monthCards(m); else if(!S.week)h+=weekCards(m);
    h+=cohortCards(m);
    if(S.month||S.week||S.cohort)h+=lessonLedger(m);
    h+=overhead(m);
    return h+'</div>';
  }
  function renderLoaded(){setChrome();const c=document.getElementById('content');if(c)c.innerHTML=view();}
  async function renderReporting(){setChrome();const c=document.getElementById('content');if(!c)return;c.innerHTML='<div class="report-page"><div class="report-empty">'+(zh()?'正在生成经营报表…':'Loading reporting…')+'</div></div>';try{const d=await api('bootstrap');if(d.locked){S.data=null;c.innerHTML=lockView();return;}S.data=d.data;c.innerHTML=view();}catch(e){c.innerHTML='<div class="report-page"><div class="report-empty">'+esc(e.message)+'</div></div>';}}
  window.reportUnlock=async()=>{const pin=document.getElementById('reportPin')?.value||'';try{await api('unlock',{pin});await renderReporting();}catch(e){alert(e.message);}};
  window.reportReset=()=>{S.month=null;S.week=null;S.cohort=null;S.from=null;S.to=null;renderLoaded();};
  window.reportSetMonth=m=>{S.month=m;S.week=null;S.from=m+'-01';S.to=endOfMonth(m);renderLoaded();};
  window.reportSetWeek=w=>{const start=dateObj(w),end=new Date(start);end.setDate(start.getDate()+6);S.week=w;S.from=dateKey(start);S.to=dateKey(end);renderLoaded();};
  window.reportSetCohort=c=>{S.cohort=c;renderLoaded();};
  window.reportFilterFrom=v=>{S.from=v||null;S.month=null;S.week=null;if(S.to&&S.from&&S.to<S.from)S.to=S.from;renderLoaded();};
  window.reportFilterTo=v=>{S.to=v||null;S.month=null;S.week=null;if(S.from&&S.to&&S.from>S.to)S.from=S.to;renderLoaded();};
  window.reportFilterCohort=v=>{S.cohort=v?decodeURIComponent(v):null;renderLoaded();};
  window.reportThisWeek=()=>{const d=new Date(),n=(d.getDay()+6)%7,start=new Date(d);start.setDate(d.getDate()-n);const end=new Date(start);end.setDate(start.getDate()+6);S.from=dateKey(start);S.to=dateKey(end);S.month=null;S.week=null;renderLoaded();};
  window.reportThisMonth=()=>{const d=new Date(),m=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');S.from=m+'-01';S.to=endOfMonth(m);S.month=null;S.week=null;renderLoaded();};
  window.reportLast30=()=>{const end=new Date(),start=new Date(end);start.setDate(end.getDate()-29);S.from=dateKey(start);S.to=dateKey(end);S.month=null;S.week=null;renderLoaded();};

  const oldGo=window.go;
  window.go=function(p){if(p==='reporting'){try{current='reporting';}catch{}renderReporting();return;}oldGo?.(p);setTimeout(patchNav,30);};
  const oldSet=window.setLanguage;
  window.setLanguage=function(n){oldSet?.(n);setTimeout(()=>{patchNav();try{if(current==='reporting')renderReporting();}catch{}},60);};
  const obs=new MutationObserver(()=>patchNav());
  window.addEventListener('load',()=>{const nav=document.getElementById('nav');if(nav)obs.observe(nav,{childList:true,subtree:false});patchNav();});
  setInterval(patchNav,1200);
})();
import crypto from 'node:crypto';

const PROJECT_URL='https://lclkojyfyqhefwmkmgym.supabase.co';
const FOUNDER_COOKIE='studio_session';
const FINANCE_COOKIE='studio_finance_session';
function key(){return process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'';}
function headers(extra={}){const k=key();const h={apikey:k,'Content-Type':'application/json',...extra};if(k.startsWith('eyJ'))h.Authorization=`Bearer ${k}`;return h;}
function cookies(req){const raw=req.headers.cookie||'';return Object.fromEntries(raw.split(';').map(p=>{const i=p.indexOf('=');return i<0?['','']:[p.slice(0,i).trim(),decodeURIComponent(p.slice(i+1).trim())]}).filter(([k])=>k));}
function safeEqual(a,b){const aa=Buffer.from(String(a||'')),bb=Buffer.from(String(b||''));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);}
function founderSig(){const s=process.env.STUDIO_ACCESS_TOKEN||'';return s?crypto.createHmac('sha256',s).update('chongyu-studio-founder-session-v1').digest('hex'):'';}
function founderAuth(req){const expected=process.env.STUDIO_ACCESS_TOKEN||'';const supplied=req.headers['x-studio-access-token']||'';if(supplied&&expected&&safeEqual(supplied,expected))return true;const c=cookies(req)[FOUNDER_COOKIE]||'';return Boolean(c&&founderSig()&&safeEqual(c,founderSig()));}
async function rest(table,q=''){const r=await fetch(`${PROJECT_URL}/rest/v1/${table}${q?`?${q}`:''}`,{headers:headers()});const t=await r.text();if(!r.ok)throw new Error(`${table}: ${r.status} ${t.slice(0,300)}`);return t?JSON.parse(t):[];}
async function insert(table,body){const r=await fetch(`${PROJECT_URL}/rest/v1/${table}`,{method:'POST',headers:headers({Prefer:'return=representation'}),body:JSON.stringify(body)});const t=await r.text();if(!r.ok)throw new Error(`${table}: ${r.status} ${t.slice(0,300)}`);return t?JSON.parse(t):[];}
async function patch(table,q,body){const r=await fetch(`${PROJECT_URL}/rest/v1/${table}?${q}`,{method:'PATCH',headers:headers({Prefer:'return=representation'}),body:JSON.stringify(body)});const t=await r.text();if(!r.ok)throw new Error(`${table}: ${r.status} ${t.slice(0,300)}`);return t?JSON.parse(t):[];}
async function remove(table,q){const r=await fetch(`${PROJECT_URL}/rest/v1/${table}?${q}`,{method:'DELETE',headers:headers({Prefer:'return=representation'})});const t=await r.text();if(!r.ok)throw new Error(`${table}: ${r.status} ${t.slice(0,300)}`);return t?JSON.parse(t):[];}
const sha=v=>crypto.createHash('sha256').update(String(v||'')).digest('hex');
async function setting(k){const r=await rest('finance_settings',`select=setting_value&setting_key=eq.${encodeURIComponent(k)}&limit=1`);return r[0]?.setting_value||'';}
async function financeSig(){const root=process.env.STUDIO_ACCESS_TOKEN||'';const pinHash=await setting('finance_pin_sha256');return root&&pinHash?crypto.createHmac('sha256',root).update(`finance-v1:${pinHash}`).digest('hex'):'';}
async function financeAuth(req){const c=cookies(req)[FINANCE_COOKIE]||'';const s=await financeSig();return Boolean(c&&s&&safeEqual(c,s));}
function setFinanceCookie(res,value,maxAge=43200){res.setHeader('Set-Cookie',`${FINANCE_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`);}
const text=(v,n=2000)=>String(v??'').trim().slice(0,n);
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null;};
async function bootstrap(){const [txns,settingsRows]=await Promise.all([
  rest('finance_transactions','select=id,txn_date,direction,category,description,hours,amount,payment_method,km,fuel_price_per_l,cost_per_km,notes,created_at,updated_at&order=txn_date.desc,created_at.desc'),
  rest('finance_settings','select=setting_key,setting_value&setting_key=in.(default_cost_per_km,default_fuel_price_per_l)')
]);return {transactions:txns,settings:Object.fromEntries(settingsRows.map(x=>[x.setting_key,x.setting_value]))};}
async function normalizedTxn(payload,existing={}){
  const direction=['income','expense'].includes(payload.direction)?payload.direction:(existing.direction||'expense');
  const category=text(payload.category,80)||existing.category||'other';
  const km=num(payload.km);
  const defaultKm=Number(await setting('default_cost_per_km'))||0.23;
  const defaultFuel=Number(await setting('default_fuel_price_per_l'))||2.30;
  let amount=num(payload.amount);
  if(direction==='expense'&&category==='transport'&&km!==null)amount=Math.round(km*defaultKm*100)/100;
  if(amount===null)amount=Number(existing.amount)||0;
  return {
    txn_date:text(payload.txn_date,10)||existing.txn_date||new Date().toISOString().slice(0,10),
    direction,category,
    description:text(payload.description,500)||null,
    hours:num(payload.hours),
    amount,
    payment_method:text(payload.payment_method,80)||null,
    km:category==='transport'?km:null,
    fuel_price_per_l:category==='transport'?defaultFuel:null,
    cost_per_km:category==='transport'?defaultKm:null,
    notes:text(payload.notes,2000)||null,
    updated_at:new Date().toISOString()
  };
}
export default async function handler(req,res){
  if(!founderAuth(req))return res.status(401).json({error:'Founder session is missing or invalid.'});
  try{
    if(req.method==='GET'){
      if(!(await financeAuth(req)))return res.status(423).json({locked:true});
      return res.status(200).json({ok:true,data:await bootstrap()});
    }
    if(req.method!=='POST')return res.status(405).json({error:'Method not allowed.'});
    const {action,payload={}}=req.body||{};
    if(action==='unlock'){
      const expected=await setting('finance_pin_sha256');
      if(!expected||!safeEqual(sha(payload.pin),expected))return res.status(403).json({error:'密码不正确'});
      const s=await financeSig();setFinanceCookie(res,s);return res.status(200).json({ok:true});
    }
    if(action==='lock'){setFinanceCookie(res,'',0);return res.status(200).json({ok:true});}
    if(!(await financeAuth(req)))return res.status(423).json({locked:true,error:'Finance session is locked.'});
    if(action==='create'){
      const body=await normalizedTxn(payload);delete body.updated_at;const rows=await insert('finance_transactions',body);return res.status(200).json({ok:true,item:rows[0]||null});
    }
    if(action==='update'){
      const id=text(payload.id,120);if(!id)throw new Error('Missing transaction id.');const existing=(await rest('finance_transactions',`select=*&id=eq.${encodeURIComponent(id)}&limit=1`))[0];if(!existing)throw new Error('Transaction not found.');const body=await normalizedTxn(payload,existing);const rows=await patch('finance_transactions',`id=eq.${encodeURIComponent(id)}`,body);return res.status(200).json({ok:true,item:rows[0]||null});
    }
    if(action==='delete'){
      const id=text(payload.id,120);if(!id)throw new Error('Missing transaction id.');await remove('finance_transactions',`id=eq.${encodeURIComponent(id)}`);return res.status(200).json({ok:true});
    }
    if(action==='update_settings'){
      const cpk=num(payload.default_cost_per_km),fuel=num(payload.default_fuel_price_per_l);if(cpk===null||cpk<=0)throw new Error('Invalid cost per km.');if(fuel===null||fuel<=0)throw new Error('Invalid fuel price.');
      await patch('finance_settings','setting_key=eq.default_cost_per_km',{setting_value:String(cpk),updated_at:new Date().toISOString()});
      await patch('finance_settings','setting_key=eq.default_fuel_price_per_l',{setting_value:String(fuel),updated_at:new Date().toISOString()});return res.status(200).json({ok:true});
    }
    if(action==='change_pin'){
      const pin=text(payload.pin,32);if(pin.length<4)throw new Error('密码至少 4 位。');await patch('finance_settings','setting_key=eq.finance_pin_sha256',{setting_value:sha(pin),updated_at:new Date().toISOString()});const s=await financeSig();setFinanceCookie(res,s);return res.status(200).json({ok:true});
    }
    throw new Error('Unknown action.');
  }catch(error){console.error('Finance API error',error);return res.status(400).json({error:error.message||'Finance request failed.'});}
}

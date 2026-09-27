import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';
const P = (rel) => fileURLToPath(new URL('../' + rel, import.meta.url)); // file path in the repo
const U = (rel) => new URL('../' + rel, import.meta.url).href;          // import URL in the repo
import fs from 'fs';
const html=fs.readFileSync(P('public/index.html'),'utf8').replace(/<script defer src=[^>]+><\/script>/,'');
const {SEED}=await import(U('tests/fixtures/store.mjs'));
function mkState(){
  const S=structuredClone(SEED); S.rev=5;
  S.commitments.forEach(c=>c.since='2026-09-10');
  const w=S.commitments.find(c=>c.id==='c2'); w.title='Morning walk'; w.parts=[{id:'pa',title:'I walked'},{id:'pb',title:'Dog walked'}];
  const chase=S.commitments.find(c=>c.id==='c9'); chase.day=28; chase.amount='$150';
  S.commitments.push({id:'cx',title:'Dentist',tier:'word',slot:'morning',freq:'once',date:'2026-10-14',since:'2026-09-10'});
  // history: mostly done, some misses on sleep
  for(let d=12; d<=25; d++){const k='2026-09-'+String(d).padStart(2,'0'); S.log[k]={};
    ['c1','c2.pa','c2.pb','c4','c5','c6','c7','c8'].forEach((id,i)=>{S.log[k][id]={s:'done',at:'09:00'};});
    if(d%3===0) S.log[k].c1={s:'missed',why:'Up late with a gig',at:'09:05'};
    if(d%4===0) S.log[k]['c2.pb']={s:'bypassed',why:"Dog at my sister's",at:'09:10',via:'email'};
    if(d===20) delete S.log[k].c7;
  }
  return S;
}
async function boot(url){
  let S=mkState(),puts=[],errors=[],charts=[],downloads=[];
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url,
    beforeParse(w){
      w.fetch=async(u,o={})=>{const m=o.method||'GET';
        if(u.startsWith('/api/state')&&m==='GET'){
          if(u.includes('token=') && !u.includes('token=GOODTOKEN')) return {status:401,ok:false,text:async()=>JSON.stringify({error:'no'})};
          return {status:200,ok:true,text:async()=>JSON.stringify({state:S,readToken:u.includes('token=')?undefined:'GOODTOKEN'})};}
        if(u==='/api/state'&&m==='PUT'){const b=JSON.parse(o.body);puts.push(b);S={...b.state,rev:b.rev+1};return {status:200,ok:true,text:async()=>JSON.stringify({state:S})};}
        return {status:200,ok:true,text:async()=>'{}'};};
      w.addEventListener('error',e=>errors.push(e.message));
      w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=()=>{}; w.print=()=>downloads.push('print');
      w.URL.createObjectURL=(b)=>{downloads.push(b);return 'blob:x';}; w.URL.revokeObjectURL=()=>{};
      w.HTMLAnchorElement.prototype.click=function(){downloads.push('click:'+this.download);};
      w.Chart=class{constructor(el,cfg){this.cfg=cfg;charts.push(this);} destroy(){this.dead=true;}};
      w.navigator.clipboard={writeText:async()=>{}};
    }});
  const w=dom.window,d=w.document,tick=()=>new Promise(r=>setTimeout(r,25));
  await tick();await tick();
  return {w,d,tick,puts,errors,charts,downloads,get S(){return S;}};
}
const T=await boot('https://day-by-datum.vercel.app/');
const {w,d,tick}=T; const txt=()=>d.getElementById('app').textContent;
const click=s=>{const el=typeof s==='string'?d.querySelector(s):s; if(!el)throw new Error('missing '+s); el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));};
const change=(s,v)=>{const el=d.querySelector(s);if(v!==undefined){if(el.type==='checkbox')el.checked=v;else el.value=v;} el.dispatchEvent(new w.Event('change',{bubbles:true}));};
const out=[]; const ok=(name,cond)=>out.push((cond?'PASS ':'FAIL ')+name);

ok('home is default, sidebar + 6 nav', d.querySelector('[aria-current="page"]')?.dataset.tab==='home' && d.querySelectorAll('.nav .nav-btn').length===6);
const kpis=[...d.querySelectorAll('.kpi')]; ok('4 KPIs', kpis.length===4);
console.log('  KPI text:', kpis.map(k=>k.textContent.replace(/\s+/g,' ').trim()).join(' | '));
ok('health card with status + suggestions', !!d.querySelector('[aria-labelledby="h-health"] .pill') && txt().includes('Suggestions'));
console.log('  health:', d.querySelector('[aria-labelledby="h-health"] .pill').textContent, '|', [...d.querySelectorAll('.tips li')].map(l=>l.textContent).join(' || '));
ok('attention card lists overdue', d.querySelectorAll('[data-sel]').length>0);
ok('charts created (2)', T.charts.filter(c=>!c.dead).length===2);
const trend=T.charts.find(c=>!c.dead&&c.cfg.type==='line'); const bar=T.charts.find(c=>!c.dead&&c.cfg.type==='bar');
ok('trend has 7 points', trend.cfg.data.labels.length===7);
trend.cfg.options.onClick({}, [{index:3}]); await tick();
ok('trend click opens day modal', !!d.querySelector('.dialog') && d.getElementById('dlg-t').textContent.includes('September'));
d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'})); await tick();
ok('Esc closes modal', !d.querySelector('.dialog'));
bar.cfg.options.onClick({}, [{index:0}]); await tick();
ok('bar click filters to Health', d.querySelector('[data-cat]').value==='device');
change('[data-cat]','all'); await tick();
change('[data-range]','30'); await tick();
ok('range 30 updates KPI + chart', d.querySelector('.kpi-label').textContent.includes('30') && T.charts.find(c=>!c.dead&&c.cfg.type==='line').cfg.data.labels.length===30);
// bulk
const boxes=[...d.querySelectorAll('[data-sel]')]; change('[data-sel="'+boxes[0].dataset.sel+'"]',true); await tick();
ok('bulk toolbar appears', !!d.querySelector('.bulk') && d.querySelector('.bulk').textContent.includes('1 selected'));
change('[data-selall]',true); await tick();
const nSel=d.querySelectorAll('[data-sel]:checked').length; ok('select all reveals + selects every overdue item', nSel===d.querySelectorAll('[data-sel]').length && nSel>boxes.length);
click('[data-bulk="missed"]'); await tick();
ok('bulk miss opens reason modal', !!d.getElementById('bulkwhy'));
click('[data-bulkconfirm]'); await tick();
ok('reason required', d.querySelector('.dialog .error-line')?.textContent.includes('reason'));
d.getElementById('bulkwhy').value='Slammed at work'; click('[data-bulkconfirm]'); await tick();
ok('bulk applied, save bar shows', !d.querySelector('.dialog') && !!d.querySelector('[data-save]') && d.querySelectorAll('[data-sel]').length===0);
click('[data-save]'); await tick(); await tick();
const lastLog=T.puts.at(-1)?.state.log['2026-09-26']||{};
console.log('  dbg nSel',nSel,'saved',Object.values(lastLog).filter(e=>e.why==='Slammed at work').length);ok('saved with shared reason', Object.values(lastLog).filter(e=>e.why==='Slammed at work').length===nSel);
ok('feed shows new misses', txt().includes('Slammed at work'));
// search
const q=d.getElementById('q'); q.value='gig'; q.dispatchEvent(new w.Event('input',{bubbles:true})); await tick();
ok('search finds reason', d.querySelectorAll('.sr').length>0 && d.querySelector('.sr').textContent.includes('Slept'));
click('.sr'); await tick();
ok('search result drills to day', !!d.querySelector('.dialog'));
click('.dialog-head [data-closemodal]'); await tick();
// export
click('[data-menu]'); await tick(); ok('export menu', d.querySelectorAll('[data-export]').length===3);
click('[data-export="csv"]'); await tick();
const blob=T.downloads.find(x=>typeof x==='object'); const csv=blob?await new Promise(r=>{const fr=new w.FileReader();fr.onload=()=>r(fr.result);fr.readAsText(blob);}):'';
ok('CSV downloaded w/ header + rows', csv.startsWith('Date,Item,Category') && csv.split('\n').length>50);
click('[data-menu]'); await tick(); click('[data-export="share"]'); await tick();
ok('share modal has view link', d.getElementById('sharelink')?.value.includes('?view=GOODTOKEN'));
click('[data-copylink]'); await tick(); await tick(); ok('copy confirms', txt().includes('Copied'));
d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'})); await tick();
click('[data-menu]'); await tick(); click('[data-export="print"]'); await new Promise(r=>setTimeout(r,80)); ok('print called', T.downloads.includes('print'));
// help, collapse
click('[data-help]'); await tick(); ok('help modal', d.getElementById('dlg-t').textContent==='How this works'); click('.dialog-head [data-closemodal]'); await tick();
click('[data-collapse]'); await tick(); ok('sidebar collapses', d.querySelector('.shell').classList.contains('collapsed')); click('[data-collapse]'); await tick();
// other pages still work
for(const t of ['today','cal','score','commitments']){click('[data-tab="'+t+'"]'); await tick(); ok('page '+t+' renders', d.querySelector('.page-title').textContent.length>0 && !T.errors.length);}
click('[data-tab="today"]'); await tick(); ok('today has bypass buttons', d.querySelectorAll('[data-act="bypassed"]').length>5);
click('[data-tab="score"]'); await tick(); click('.cell[data-openday]'); await tick(); ok('scorecard cell drills to day', !!d.querySelector('.dialog'));
click('.dialog-head [data-closemodal]'); await tick();
// KPI drill
click('[data-tab="home"]'); await tick(); click('.kpi[data-tab="today"]'); await tick(); ok('KPI drills to Today', d.querySelector('.page-title').textContent==='Today');
ok('no runtime errors (owner)', T.errors.length===0); if(T.errors.length)console.log(T.errors);
w.close();

// read-only
const R=await boot('https://day-by-datum.vercel.app/?view=GOODTOKEN');
const rt=()=>R.d.getElementById('app').textContent;
ok('view-only loads with banner', rt().includes('View-only'));
ok('view-only hides Commitments + actions', !!R.d.querySelector('.nav [data-tab="progress"]') && !R.d.querySelector('[data-tab="commitments"]') && !R.d.querySelector('[data-sel]') && !R.d.querySelector('[data-logout]'));
R.d.querySelector('[data-tab="today"]').dispatchEvent(new R.w.MouseEvent('click',{bubbles:true})); await R.tick();
ok('view-only Today has no buttons', R.d.querySelectorAll('[data-act]').length===0);
ok('no runtime errors (view-only)', R.errors.length===0); if(R.errors.length)console.log(R.errors);
R.w.close();
const B=await boot('https://day-by-datum.vercel.app/?view=BADTOKEN');
ok('bad view link shows error state', B.d.getElementById('app').textContent.includes('isn’t valid'));
B.w.close();
console.log(out.join('\n')); console.log(out.filter(x=>x.startsWith('FAIL')).length+' failed of '+out.length);
process.exit(0);

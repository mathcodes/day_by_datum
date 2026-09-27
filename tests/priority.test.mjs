import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';
const P = (rel) => fileURLToPath(new URL('../' + rel, import.meta.url)); // file path in the repo
const U = (rel) => new URL('../' + rel, import.meta.url).href;          // import URL in the repo
import fs from 'fs';
const html=fs.readFileSync(P('public/index.html'),'utf8').replace(/<script defer src=[^>]+><\/script>/,'');
const {SEED}=await import(U('tests/fixtures/store.mjs'));
const {occurs,units,localNow,toMins,addDays}=await import(U('lib/time.js'));
const S=structuredClone(SEED); S.rev=1;
S.commitments.forEach(c=>c.since='2026-09-21');
S.commitments.find(c=>c.id==='c1').priority='high';   // sleep
S.commitments.find(c=>c.id==='c7').priority='low';    // 10,000 steps
const walk=S.commitments.find(c=>c.id==='c2'); walk.priority='high'; walk.parts=[{id:'pa',title:'I walked'},{id:'pb',title:'Dog walked'}];
// Only sleep done Mon-Fri; only steps done Mon-Fri; I-walked done Mon
for(const k of ['2026-09-21','2026-09-22','2026-09-23','2026-09-24','2026-09-25']){S.log[k]={c1:{s:'done'},c7:{s:'done'}};}
S.log['2026-09-21']['c2.pa']={s:'done'};
const W={high:4,medium:2,low:1};
const nowN=localNow('America/New_York');
function exp(ws){let t=0,d=0,tasks=0,td=0;for(let i=0;i<7;i++){const k=addDays(ws,i);for(const c of S.commitments)if(occurs(c,k))for(const u of units(c)){
  const e=(S.log[k]||{})[u.key];if(e&&e.s==='bypassed')continue;const wt=W[c.priority||'medium']/((c.parts&&c.parts.length)||1);
  t+=wt;tasks++;if(e&&e.s==='done'){d+=wt;td++;}}}return {t,d,pct:Math.round(d/t*100),tasks,td};}
const errors=[];
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.app/',beforeParse(win){
  win.fetch=async(u,o={})=>({status:200,ok:true,text:async()=>JSON.stringify({state:S})});
  win.addEventListener('error',e=>errors.push(e.message));win.scrollTo=()=>{};win.Chart=class{destroy(){}};}});
const {window:Wn}=dom,d=Wn.document,tick=()=>new Promise(r=>setTimeout(r,25));await tick();await tick();
const out=[];const ok=(n,c)=>out.push((c?'PASS ':'FAIL ')+n);
const e=exp('2026-09-21'); const card=d.querySelector('.wk');
console.log('  expected:',e,'| card says:',card.querySelector('.wk-num').textContent);
ok('weighted pct '+e.pct+'%', card.querySelector('.wk-num .kpi-value').textContent===e.pct+'%');
ok('points + task counts shown', card.textContent.includes(e.d+' of '+e.t+' points, '+e.td+' of '+e.tasks+' tasks'));
// sleep (high, 5 done) vs steps (low, 5 done): health segment = 5*4+5*1 =25 of total
const seg=card.querySelector('.seg'); ok('health segment width = (20+5)/'+e.t, Math.abs(parseFloat(seg.style.width)-25/e.t*100)<0.01);
// compare: same 10 completions all-medium would be
const unweighted=Math.round(10*2/(e.tasks*2)*100); console.log('  if everything were Medium it would read '+Math.round(11/e.tasks*100)+'% instead of '+e.pct+'%');
// editor
d.querySelector('[data-tab="commitments"]').dispatchEvent(new Wn.MouseEvent('click',{bubbles:true}));await tick();
ok('list shows High badge on sleep', [...d.querySelectorAll('.crow')].find(r=>r.textContent.includes('Slept')).querySelector('.prio-high')!=null);
d.querySelector('[data-edit="c7"]').dispatchEvent(new Wn.MouseEvent('click',{bubbles:true}));await tick();
const sel=d.querySelector('[data-f="priority"]'); ok('editor shows Low for steps', sel.value==='low');
sel.value='medium'; d.querySelector('[data-apply]').dispatchEvent(new Wn.MouseEvent('click',{bubbles:true}));await tick();
d.querySelector('[data-add]').dispatchEvent(new Wn.MouseEvent('click',{bubbles:true}));await tick();
d.querySelector('[data-f="title"]').value='Groceries instead of takeout'; d.querySelector('[data-f="priority"]').value='low';
d.querySelector('[data-apply]').dispatchEvent(new Wn.MouseEvent('click',{bubbles:true}));await tick();
ok('new low-priority item listed', [...d.querySelectorAll('.crow')].some(r=>r.textContent.includes('Groceries')&&r.querySelector('.prio-low')));
d.querySelector('[data-tab="today"]').dispatchEvent(new Wn.MouseEvent('click',{bubbles:true}));await tick();
ok('Today flags high priority', [...d.querySelectorAll('.item')].some(r=>r.textContent.includes('Slept')&&r.querySelector('.prio-high')));
d.querySelector('[data-tab="progress"]').dispatchEvent(new Wn.MouseEvent('click',{bubbles:true}));await tick();
ok('history uses points', d.querySelector('.hist-num').textContent.includes('pts'));
ok('no runtime errors',!errors.length); if(errors.length)console.log(errors);
console.log(out.join('\n'));console.log(out.filter(x=>x.startsWith('FAIL')).length+' failed of '+out.length);Wn.close();process.exit(0);

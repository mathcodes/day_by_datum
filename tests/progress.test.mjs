import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';
const P = (rel) => fileURLToPath(new URL('../' + rel, import.meta.url)); // file path in the repo
const U = (rel) => new URL('../' + rel, import.meta.url).href;          // import URL in the repo
import fs from 'fs';
const html=fs.readFileSync(P('public/index.html'),'utf8').replace(/<script defer src=[^>]+><\/script>/,'');
const {SEED}=await import(U('tests/fixtures/store.mjs'));
const {occurs,units,localNow,toMins,addDays}=await import(U('lib/time.js'));
const S=structuredClone(SEED); S.rev=1;
S.commitments.forEach(c=>c.since='2026-09-07');
const w=S.commitments.find(c=>c.id==='c2'); w.title='Morning walk'; w.parts=[{id:'pa',title:'I walked'},{id:'pb',title:'Dog walked'}];
Object.assign(S.commitments.find(c=>c.id==='c9'),{day:24,amount:'$150'});
Object.assign(S.commitments.find(c=>c.id==='c11'),{day:1,amount:'$1,400'});
// history with different mixes per week
for(let i=0;i<20;i++){const k=addDays('2026-09-07',i); S.log[k]={};
  for(const c of S.commitments) if(occurs(c,k)) for(const u of units(c)){
    const r=(i*7+u.key.length*3)%10;
    if(r<6) S.log[k][u.key]={s:'done',at:'09:00'};
    else if(r<8) S.log[k][u.key]={s:'missed',why:'x',at:'09:00'};
    else if(r===8) S.log[k][u.key]={s:'bypassed',why:'y',at:'09:00'};
  }}
// independent expected calc
const pts=v=>{v=Math.round(v*10)/10;return v%1===0?v.toFixed(0):v.toFixed(1);};
const nowN=localNow('America/New_York');
function past(k,u){return k<nowN.key||(k===nowN.key&&toMins(S.settings.checkpoints[u.c.slot])<=nowN.mins);}
function expect(ws){const r={total:0,done:0,pace:0,cat:{device:[0,0],paper:[0,0],word:[0,0]}};
  for(let i=0;i<7;i++){const k=addDays(ws,i);for(const c of S.commitments) if(occurs(c,k)) for(const u of units(c)){
    const e=(S.log[k]||{})[u.key]; if(e&&e.s==='bypassed')continue; const wt=2/((c.parts&&c.parts.length)||1); r.total+=wt;r.cat[c.tier][1]+=wt;
    if(e&&e.s==='done'){r.done+=wt;r.cat[c.tier][0]+=wt;} if(past(k,u))r.pace+=wt;}}
  r.pct=r.total?Math.round(r.done/r.total*100):null; return r;}
const errors=[];
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.app/',beforeParse(win){
  win.fetch=async()=>({status:200,ok:true,text:async()=>JSON.stringify({state:S})});
  win.addEventListener('error',e=>errors.push(e.message)); win.scrollTo=()=>{}; win.Chart=class{constructor(){}destroy(){}};}});
const {window:W}=dom,d=W.document,tick=()=>new Promise(r=>setTimeout(r,25)); await tick();await tick();
const out=[];const ok=(n,c)=>out.push((c?'PASS ':'FAIL ')+n);
const ws='2026-09-21', e=expect(ws);
const card=d.querySelector('.wk'); ok('week card leads the dashboard grid', d.querySelector('.dash').firstElementChild.firstElementChild===card);
ok('week label Sep 21–27', card.textContent.includes('Sep 21–27'));
ok('pct matches ('+e.pct+'%)', card.querySelector('.wk-num .kpi-value').textContent===e.pct+'%');
ok('done/total matches ('+e.done+' of '+e.total+')', card.textContent.includes(pts(e.done)+' of '+pts(e.total)+' points'));
const segs=[...card.querySelectorAll('.wk-bar .seg')]; const widths=segs.map(s=>parseFloat(s.style.width));
const expW=['device','paper','word'].map(c=>e.cat[c][0]/e.total*100).filter(v=>v>0);
ok('segment widths match per category', widths.length===expW.length && widths.every((v,i)=>Math.abs(v-expW[i])<0.01));
ok('filled width = pct', Math.abs(widths.reduce((a,b)=>a+b,0)-e.done/e.total*100)<0.01);
ok('segment colors are group colors', segs.every(s=>/--g-(health|money|habits)/.test(s.getAttribute('style'))));
const pace=card.querySelector('.wk-pace'); ok('pace marker at '+Math.round(e.pace/e.total*100)+'%', pace && pace.style.left===Math.round(e.pace/e.total*100)+'%');
ok('legend per category', ['device','paper','word'].every(c=>card.textContent.includes(pts(e.cat[c][0])+' of '+pts(e.cat[c][1])+' pts')));
ok('aria summary', card.querySelector('.wk-bar').getAttribute('aria-label').includes(e.pct+'% filled'));
d.querySelector('[data-tab="progress"].link').dispatchEvent(new W.MouseEvent('click',{bubbles:true})); await tick();
ok('history page title', d.querySelector('.page-title').textContent==='Progress history');
const rows=[...d.querySelectorAll('.hist-row')]; ok('3 weeks listed (since Sep 7)', rows.length===3);
const wks=['2026-09-21','2026-09-14','2026-09-07'];
rows.forEach((r,i)=>{const x=expect(wks[i]);const ws2=[...r.querySelectorAll('.seg')].map(s=>parseFloat(s.style.width));
  ok('week '+wks[i]+' = '+x.pct+'% '+x.done+'/'+x.total, r.querySelector('.hist-num b').textContent===x.pct+'%' && r.textContent.includes(pts(x.done)+'/'+pts(x.total)+' pts') && Math.abs(ws2.reduce((a,b)=>a+b,0)-x.done/x.total*100)<0.01);});
ok('current week marked', rows[0].classList.contains('cur') && rows[0].textContent.includes('In progress'));
const past2=[expect(wks[1]),expect(wks[2])], best=Math.max(...past2.map(x=>x.pct)), avg=Math.round(past2.reduce((a,x)=>a+x.pct,0)/2);
ok('best week '+best+'% avg '+avg+'%', d.querySelector('.hist-sum').textContent.includes(best+'%') && d.querySelector('.hist-sum').textContent.includes(avg+'%'));
ok('nav has Progress', !!d.querySelector('.nav [data-tab="progress"][aria-current="page"]'));
ok('no runtime errors', !errors.length); if(errors.length)console.log(errors);
console.log(out.join('\n'));console.log(out.filter(x=>x.startsWith('FAIL')).length+' failed of '+out.length);
W.close();process.exit(0);

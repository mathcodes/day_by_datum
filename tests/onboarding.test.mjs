import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';
const P = (rel) => fileURLToPath(new URL('../' + rel, import.meta.url)); // file path in the repo
const U = (rel) => new URL('../' + rel, import.meta.url).href;          // import URL in the repo
import fs from 'fs';
const html=fs.readFileSync(P('public/index.html'),'utf8').replace(/<script defer src=[^>]+><\/script>/,'');
const {SEED}=await import(U('lib/store.js'));
const OLD=(await import(U('tests/fixtures/store.mjs'))).SEED;
const T=await import(U('lib/time.js'));
async function boot(S){
  const puts=[],errors=[];
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.app/',beforeParse(w){
    w.fetch=async(u,o={})=>{if((o.method||'GET')==='PUT'){const b=JSON.parse(o.body);puts.push(b);S={...b.state,rev:b.rev+1};}
      return {status:200,ok:true,text:async()=>JSON.stringify({state:S})};};
    w.addEventListener('error',e=>errors.push(e.message));w.scrollTo=()=>{};w.Chart=class{destroy(){}};}});
  const W=dom.window,d=W.document,tick=()=>new Promise(r=>setTimeout(r,25));await tick();await tick();
  return {W,d,tick,puts,errors,click:async s=>{const el=typeof s==='string'?d.querySelector(s):s;if(!el)throw new Error('missing '+s);el.dispatchEvent(new W.MouseEvent('click',{bubbles:true}));await tick();},
    change:async(s,v)=>{const el=d.querySelector(s);if(el.type==='checkbox')el.checked=v;else el.value=v;el.dispatchEvent(new W.Event('change',{bubbles:true}));await tick();}};
}
const out=[];const ok=(n,c)=>out.push((c?'PASS ':'FAIL ')+n);
// ---- server weekly occurs ----
ok('server weekly: Sun item on a Sunday only', T.occurs({freq:'weekly',dow:0},'2026-09-27')&&!T.occurs({freq:'weekly',dow:0},'2026-09-28'));
// ---- fresh install ----
let A=await boot(structuredClone(SEED));
ok('fresh install lands on onboarding', !!A.d.querySelector('.onb-page')&&A.d.body.textContent.includes('What does a good day look like'));
const cards=[...A.d.querySelectorAll('.tpl-card')]; ok('8 templates + scratch', cards.length===9 && !!A.d.querySelector('[data-tpl="scratch"]'));
ok('template names', ['College student','New parent','Single, midlife','Starting over','Kid, run by a parent','Older adult','Traveler','Midlife reset'].every(n=>A.d.body.textContent.includes(n)));
await A.click('[data-tpl="student"]');
ok('review step shows checkpoint times from template', A.d.querySelector('[data-onbcp="morning"]').value==='10:00'&&A.d.querySelector('[data-onbcp="evening"]').value==='22:00');
const rows=A.d.querySelectorAll('.onb-row'); ok('9 student items, all checked', rows.length===9&&A.d.querySelectorAll('[data-onbsel]:checked').length===9);
ok('grouped by Health/Money/Habits', ['Health','Money','Habits'].every(g=>[...A.d.querySelectorAll('.onb-group')].some(h=>h.textContent===g)));
ok('sleep defaults High, rent High (money+fixed)', A.d.querySelector('[data-onbpr="0"]').value==='high'&&A.d.querySelector('[data-onbpr="6"]').value==='high');
ok('weekly item labeled', A.d.body.textContent.includes('Weekly on Sunday'));
await A.change('[data-onbsel="8"]',false); // laundry off
ok('uncheck updates count', A.d.querySelector('[data-onbfinish]').textContent==='Start with 8 commitments');
await A.change('[data-onbpr="3"]','low');
const day=A.d.querySelector('[data-onbday="6"]'); day.value='1'; day.dispatchEvent(new A.W.Event('input',{bubbles:true}));
await A.change('[data-onbcp="morning"]','09:30');
await A.click('[data-onbfinish]'); await A.tick();
const st=A.puts.at(-1)?.state;
ok('saved: onboarded + 8 items', st&&st.onboarded===true&&st.commitments.length===8);
ok('saved: checkpoints incl. edit', st.settings.checkpoints.morning==='09:30'&&st.settings.checkpoints.evening==='22:00');
const rent=st.commitments.find(c=>c.title.startsWith('Rent')), chk=st.commitments.find(c=>c.title.startsWith('Checked what'));
ok('saved: rent due day 1, High, q kept', rent.day===1&&rent.priority==='high'&&rent.q.join()==='money,fixed');
ok('saved: override recorded as manual', chk.priority==='low'&&chk.priorityManual===true);
ok('saved: weekly dow', st.commitments.find(c=>c.freq==='weekly').dow===0);
ok('after finish: home dashboard', !!A.d.querySelector('.home')&&!A.d.querySelector('.onb-page'));
ok('no errors (fresh)',!A.errors.length); if(A.errors.length)console.log(A.errors); A.W.close();
// ---- kid template parts ----
A=await boot(structuredClone(SEED)); await A.click('[data-tpl="kid"]'); await A.click('[data-onbfinish]'); await A.tick();
const mr=A.puts.at(-1).state.commitments.find(c=>c.title==='Morning routine'); ok('kid: parts created', mr&&mr.parts.length===3&&mr.parts[0].title==='Made the bed');
A.W.close();
// ---- scratch ----
A=await boot(structuredClone(SEED)); await A.click('[data-tpl="scratch"]'); await A.tick();
ok('scratch: onboarded, editor open', A.puts.at(-1).state.onboarded===true&&!!A.d.getElementById('form'));
A.W.close();
// ---- existing user: never forced, add-mode dedupes ----
const E=structuredClone(OLD); E.rev=9;
A=await boot(E);
ok('existing user not forced into onboarding', !A.d.querySelector('.onb-page')&&!!A.d.querySelector('.home'));
await A.click('[data-tab="commitments"]'); await A.click('[data-templates]');
ok('add mode inside app shell', !!A.d.querySelector('.shell .onb')&&A.d.querySelector('.page-title').textContent==='Templates'&&!A.d.querySelector('[data-tpl="scratch"]'));
await A.click('[data-tpl="single"]');
const dup=[...A.d.querySelectorAll('.onb-row')].find(r=>r.textContent.includes('Slept 7+ hours'));
ok('duplicate disabled + labeled', dup.querySelector('input').disabled&&dup.textContent.includes('Already on your list'));
ok('no checkpoint times in add mode', !A.d.querySelector('[data-onbcp]'));
const before=E.commitments.length; await A.click('[data-onbfinish]'); await A.tick();
const s2=A.puts.at(-1).state; ok('added 8, skipped dup', s2.commitments.length===before+8&&s2.settings.checkpoints.morning==='09:00');
ok('back on Commitments with notice', A.d.querySelector('.page-title').textContent==='Commitments');
// weekly editor
await A.click('[data-add="commitment"]'); await A.change('[data-f="freq"]','weekly');
ok('editor weekly day picker', !!A.d.querySelector('[data-f="dow"]'));
A.d.querySelector('[data-f="title"]').value='Call Mom'; await A.change('[data-f="dow"]','0'); await A.click('[data-apply]');
ok('weekly saved in list', [...A.d.querySelectorAll('.crow')].some(r=>r.textContent.includes('Call Mom')&&r.textContent.includes('Weekly on Sunday')));
await A.click('[data-tab="home"]'); ok('nav away clears templates', !A.d.querySelector('.onb'));
ok('no errors (existing)',!A.errors.length); if(A.errors.length)console.log(A.errors);
console.log(out.join('\n'));console.log(out.filter(x=>x.startsWith('FAIL')).length+' failed of '+out.length);A.W.close();process.exit(0);

import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';
const P = (rel) => fileURLToPath(new URL('../' + rel, import.meta.url)); // file path in the repo
const U = (rel) => new URL('../' + rel, import.meta.url).href;          // import URL in the repo
import fs from 'fs';
const html=fs.readFileSync(P('public/index.html'),'utf8').replace(/<script defer src=[^>]+><\/script>/,'');
const {SEED}=await import(U('tests/fixtures/store.mjs'));
const {localNow}=await import(U('lib/time.js'));
const today=localNow('America/New_York').key;
let S=structuredClone(SEED); S.rev=1; S.commitments.forEach(c=>c.since='2026-09-21');
S.commitments.find(c=>c.id==='c1').priority='high';
const puts=[],errors=[];
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.app/',beforeParse(w){
  w.fetch=async(u,o={})=>{if((o.method||'GET')==='PUT'){const b=JSON.parse(o.body);puts.push(b);S={...b.state,rev:b.rev+1};}
    return {status:200,ok:true,text:async()=>JSON.stringify({state:S})};};
  w.addEventListener('error',e=>errors.push(e.message));w.scrollTo=()=>{};w.Chart=class{destroy(){}};}});
const W=dom.window,d=W.document,tick=()=>new Promise(r=>setTimeout(r,25));await tick();await tick();
const click=s=>{const el=typeof s==='string'?d.querySelector(s):s;if(!el)throw new Error('missing '+s);el.dispatchEvent(new W.MouseEvent('click',{bubbles:true}));};
const setv=(s,v)=>{d.querySelector(s).value=v;};
const chk=async(id,on)=>{const el=d.querySelector('[data-q="'+id+'"]');el.checked=on;el.dispatchEvent(new W.Event('change',{bubbles:true}));await tick();};
const sug=()=>d.querySelector('.qual-sug .prio').textContent, pri=()=>d.querySelector('[data-f="priority"]').value;
const out=[];const ok=(n,c)=>out.push((c?'PASS ':'FAIL ')+n);
click('[data-tab="commitments"]');await tick();
ok('two add buttons', !!d.querySelector('[data-add="commitment"]')&&!!d.querySelector('[data-add="event"]'));
// --- commitment with qualifier
click('[data-add="commitment"]');await tick();
ok('qualifier shown, nothing checked -> Low', sug()==='Low'&&pri()==='low');
await chk('health',true); ok('health -> Medium', sug()==='Medium'&&pri()==='medium');
await chk('money',true); ok('health+money (3) -> High', sug()==='High'&&pri()==='high'&&d.querySelector('.qual-sug').textContent.includes('costs money'));
d.querySelector('[data-f="priority"]').value='medium'; d.querySelector('[data-f="priority"]').dispatchEvent(new W.Event('change',{bubbles:true}));await tick();
ok('manual override sticks + labeled', pri()==='medium'&&d.querySelector('.qual').textContent.includes('your override')&&!!d.querySelector('[data-usesug]'));
await chk('goal',true); ok('override survives more checks', pri()==='medium');
click('[data-usesug]');await tick(); ok('use suggestion restores High', pri()==='high');
await chk('goal',false);await chk('money',false); ok('unchecking lowers suggestion again', pri()==='medium');
setv('[data-f="title"]','Groceries instead of takeout'); d.querySelector('[data-f="tier"]').value='paper';
click('[data-apply]');await tick();
// --- event
click('[data-add="event"]');await tick();
ok('event form: date/time/where/who', ['date','time','where','who'].every(f=>d.querySelector('[data-f="'+f+'"]')));
ok('event pre-checks people+fixed -> High', d.querySelector('[data-q="people"]').checked&&d.querySelector('[data-q="fixed"]').checked&&sug()==='High');
setv('[data-f="title"]','Khruangbin at the Ritz'); click('[data-apply]');await tick();
ok('event requires date+time', d.querySelector('.error-line')?.textContent.includes('date and a start time'));
setv('[data-f="date"]',today); setv('[data-f="time"]','19:30'); setv('[data-f="where"]','The Ritz, Raleigh'); setv('[data-f="who"]','Knight');
click('[data-apply]');await tick();
ok('upcoming events section lists it', d.body.textContent.includes('Upcoming events')&&[...d.querySelectorAll('.crow')].some(r=>r.textContent.includes('Khruangbin')&&r.textContent.includes('7:30 PM')&&r.querySelector('.prio-high')));
// segmented switch keeps title
click('[data-add="commitment"]');await tick(); setv('[data-f="title"]','Dinner w/ band'); click('[data-kind="event"]');await tick();
ok('type switch keeps title', d.querySelector('[data-f="title"]').value==='Dinner w/ band'&&!!d.querySelector('[data-f="time"]'));
click('[data-cancel]');await tick();
click('[data-save]');await tick();await tick();
const saved=puts.at(-1).state.commitments; const ev=saved.find(c=>c.kind==='event'), gro=saved.find(c=>c.title.startsWith('Groceries'));
ok('saved event fields', ev&&ev.tier==='event'&&ev.freq==='once'&&ev.slot==='evening'&&ev.priority==='high'&&ev.q.join()==='people,fixed'&&ev.who==='Knight');
ok('saved commitment q + priority', gro&&gro.priority==='medium'&&gro.q.join()==='health'&&gro.tier==='paper');
// --- displays
click('[data-tab="today"]');await tick();
ok('Today shows event with time/place', [...d.querySelectorAll('.item')].some(r=>r.textContent.includes('Khruangbin')&&r.textContent.includes('7:30 PM, The Ritz, Raleigh, with Knight')));
click('[data-tab="cal"]');await tick();
ok('calendar event chip', d.querySelector('[data-day="'+today+'"] .chip-event')?.textContent.includes('7:30 PM Khruangbin'));
click('[data-tab="home"]');await tick();
ok('weekly bar has Events legend', d.querySelector('.wk-legend').textContent.includes('Events'));
ok('category filter has Events', [...d.querySelectorAll('[data-cat] option')].some(o=>o.textContent==='Events'));
// existing item keeps its priority
click('[data-tab="commitments"]');await tick(); click('[data-edit="c1"]');await tick();
ok('legacy High item stays High, marked override', pri()==='high'&&d.querySelector('.qual').textContent.includes('your override'));
await chk('health',true); ok('checking a box does not clobber it', pri()==='high');
ok('no runtime errors',!errors.length); if(errors.length)console.log(errors);
console.log(out.join('\n'));console.log(out.filter(x=>x.startsWith('FAIL')).length+' failed of '+out.length);W.close();process.exit(0);

import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';
const P = (rel) => fileURLToPath(new URL('../' + rel, import.meta.url)); // file path in the repo
const U = (rel) => new URL('../' + rel, import.meta.url).href;          // import URL in the repo
process.env.APP_SECRET='x'.repeat(40);process.env.READ_TOKEN='rt';process.env.UPSTASH_REDIS_REST_URL='https://r';process.env.UPSTASH_REDIS_REST_TOKEN='t';

import fs from 'fs';
const html=fs.readFileSync(P('public/index.html'),'utf8').replace(/<script defer src=[^>]+><\/script>/,'');
const OLD=(await import(U('tests/fixtures/store.mjs'))).SEED;
const {localNow,addDays,parseKey}=await import(U('lib/time.js'));
const T=localNow('America/New_York').key, end=addDays(T,60);
const ymd=k=>k.replace(/-/g,''), dow=k=>parseKey(k).getUTCDay();
const nextDow=(from,d)=>{let k=from;while(dow(k)!==d)k=addDays(k,1);return k;};
// ---------- Google calendar file ----------
const start2=addDays(T,-14), exMon=nextDow(addDays(T,1),1);
const G=(e1time='183000Z',withE3=true)=>['BEGIN:VCALENDAR','VERSION:2.0','X-WR-CALNAME:Work',
 'BEGIN:VEVENT','UID:e1@g','SUMMARY:Dentist','DTSTART:'+ymd(addDays(T,1))+'T'+e1time,'LOCATION:Main St','END:VEVENT',
 'BEGIN:VEVENT','UID:e2@g','SUMMARY:Standup','DTSTART;TZID=America/New_York:'+ymd(start2)+'T100000','RRULE:FREQ=WEEKLY;BYDAY=MO,WE','EXDATE;TZID=America/New_York:'+ymd(exMon)+'T100000','END:VEVENT',
 ...(withE3?['BEGIN:VEVENT','UID:e3@g','SUMMARY:Mom\'s birthday','DTSTART;VALUE=DATE:'+ymd(addDays(T,3)),'END:VEVENT']:[]),
 'BEGIN:VEVENT','UID:e4@g','SUMMARY:Run','DTSTART;TZID=America/New_York:'+ymd(T)+'T070000','RRULE:FREQ=DAILY;COUNT=5','END:VEVENT',
 'BEGIN:VEVENT','UID:e4@g','SUMMARY:Run (late)','RECURRENCE-ID;TZID=America/New_York:'+ymd(addDays(T,2))+'T070000','DTSTART;TZID=America/New_York:'+ymd(addDays(T,2))+'T090000','END:VEVENT',
 'BEGIN:VEVENT','UID:e5@g','SUMMARY:Old thing','DTSTART:'+ymd(addDays(T,-7))+'T150000Z','END:VEVENT',
 'BEGIN:VEVENT','UID:e6@g','SUMMARY:Cancelled','STATUS:CANCELLED','DTSTART:'+ymd(addDays(T,1))+'T150000Z','END:VEVENT',
 'BEGIN:VEVENT','UID:e7@g','SUMMARY:Dinner\\, with the band at a very long place name that','  keeps going','DTSTART;TZID=America/New_York:'+ymd(addDays(T,4))+'T193000','END:VEVENT',
 'END:VCALENDAR'].join('\r\n');
// expected (independent)
const exp=[];
exp.push({t:'Dentist',k:addDays(T,1),h:'14:30'});
for(let k=T;k<=end;k=addDays(k,1)){if((dow(k)===1||dow(k)===3)&&k!==exMon)exp.push({t:'Standup',k,h:'10:00'});}
exp.push({t:"Mom's birthday",k:addDays(T,3),h:''});
[0,1,3,4].forEach(i=>exp.push({t:'Run',k:addDays(T,i),h:'07:00'})); exp.push({t:'Run (late)',k:addDays(T,2),h:'09:00'});
exp.push({t:'Dinner, with the band at a very long place name that keeps going',k:addDays(T,4),h:'19:30'});
// ---------- Outlook file ----------
const fri=nextDow(T,5);
let tue2=null;{const d=parseKey(T);for(let mo=0;mo<3&&!tue2;mo++){const f=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+mo,1));let c=new Date(f);c.setUTCDate(1+((2-f.getUTCDay()+7)%7)+7);const k=c.toISOString().slice(0,10);if(k>=T)tue2=k;}}
const O=['BEGIN:VCALENDAR','VERSION:2.0','X-WR-CALNAME:Band',
 'BEGIN:VEVENT','UID:o1','SUMMARY:Rehearsal','DTSTART;TZID="Eastern Standard Time":'+ymd(fri)+'T190000','RRULE:FREQ=WEEKLY','END:VEVENT',
 'BEGIN:VEVENT','UID:o2','SUMMARY:Board call','DTSTART;TZID="Pacific Standard Time":'+ymd(addDays(T,-40))+'T090000','RRULE:FREQ=MONTHLY;BYDAY=2TU','END:VEVENT',
 'END:VCALENDAR'].join('\r\n');
const expO=[];for(let k=fri;k<=end;k=addDays(k,7))expO.push({t:'Rehearsal',k,h:'19:00'});
{const d=parseKey(T);for(let mo=0;mo<3;mo++){const f=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+mo,1));const c=new Date(f);c.setUTCDate(1+((2-f.getUTCDay()+7)%7)+7);const k=c.toISOString().slice(0,10);if(k>=T&&k<=end)expO.push({t:'Board call',k,h:'12:00'});}}
// ---------- boot ----------
let S=structuredClone(OLD);S.rev=5;let ics=G();const puts=[],errors=[],icsCalls=[];
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.app/',beforeParse(w){
  w.fetch=async(u,o={})=>{
    if(u.startsWith('/api/ics')){icsCalls.push(decodeURIComponent(u.split('url=')[1]));return {ok:true,status:200,text:async()=>ics};}
    if((o.method||'GET')==='PUT'){const b=JSON.parse(o.body);puts.push(b);S={...b.state,rev:b.rev+1};}
    return {status:200,ok:true,text:async()=>JSON.stringify({state:S})};};
  w.addEventListener('error',e=>errors.push(e.message));w.scrollTo=()=>{};w.Chart=class{destroy(){}};}});
const W=dom.window,d=W.document,tick=()=>new Promise(r=>setTimeout(r,30));await tick();await tick();
const click=async s=>{const el=typeof s==='string'?d.querySelector(s):s;if(!el)throw new Error('missing '+s);el.dispatchEvent(new W.MouseEvent('click',{bubbles:true}));await tick();};
const typ=async(s,v)=>{const el=d.querySelector(s);el.value=v;el.dispatchEvent(new W.Event('input',{bubbles:true}));};
const out=[];const ok=(n,c,extra)=>{out.push((c?'PASS ':'FAIL ')+n);if(!c&&extra)console.log('   ',extra);};
const same=(got,exp)=>{const g=got.map(x=>x.t+'|'+x.k+'|'+x.h).sort(),e=exp.map(x=>x.t+'|'+x.k+'|'+x.h).sort();return {ok:JSON.stringify(g)===JSON.stringify(e),g,e};};
// Commitments page buttons
await click('[data-tab="commitments"]');
const btns=[...d.querySelectorAll('.cal-link')];
ok('two equal link buttons with logos', btns.length===2&&btns[0].querySelector('img').getAttribute('src')==='/brand/google-g.png'&&btns[1].querySelector('img').getAttribute('src')==='/brand/outlook.png');
await click('[data-callink="google"]');
ok('google live-link steps', d.querySelector('.dialog').textContent.includes('Secret address in iCal format')&&d.getElementById('dlg-t').textContent==='Link Google Calendar');
await typ('[data-calurl]','calendar.google.com/foo'); await click('[data-calpreview]');
ok('rejects link without https', d.querySelector('.dialog .error-line')?.textContent.includes('https://'));
await typ('[data-calname]','Work'); await typ('[data-calurl]','https://calendar.google.com/calendar/ical/abc/private-xyz/basic.ics'); await click('[data-calpreview]'); await tick();
const rows=[...d.querySelectorAll('.prev-list li')];
const got=rows.map(li=>{const t=li.querySelector('b').textContent;const meta=li.querySelector('.muted').textContent;return {t,meta};});
// convert preview rows to comparable via internal names: check count + a few
const r1=same(exp,exp); // placeholder
ok('preview count matches expected ('+exp.length+')', rows.length===exp.length, rows.length+' vs '+exp.length);
ok('cancelled + past excluded', !got.some(x=>x.t==='Cancelled'||x.t==='Old thing'));
ok('all-day shown as All day', got.find(x=>x.t==="Mom's birthday").meta.includes('All day'));
ok('UTC converted to 2:30 PM', got.find(x=>x.t==='Dentist').meta.includes('2:30 PM, Main St'));
ok('folded + escaped summary', got.some(x=>x.t==='Dinner, with the band at a very long place name that keeps going'));
// uncheck one Standup, set High, import
const stIdx=rows.findIndex(li=>li.textContent.includes('Standup'));
const sb=d.querySelector('[data-calsel="'+stIdx+'"]');sb.checked=false;sb.dispatchEvent(new W.Event('change',{bubbles:true}));await tick();
const pr=d.querySelector('[data-calprio]');pr.value='high';pr.dispatchEvent(new W.Event('change',{bubbles:true}));
await click('[data-calimport]'); await tick();
let st=puts.at(-1).state; const feed=st.feeds[0];
const imp=st.commitments.filter(c=>c.src==='feed:'+feed.id);
const cmp=same(imp.map(c=>({t:c.title,k:c.date,h:c.time})),exp.filter((x,i)=>!(x.t==='Standup'&&x.k===exp.filter(y=>y.t==='Standup').map(y=>y.k).sort()[0])));
ok('imported events exactly match expected (minus unchecked)', cmp.ok, cmp.ok?'':JSON.stringify({got:cmp.g.slice(0,6),exp:cmp.e.slice(0,6)}));
ok('feed saved: name, skip, priority', feed.name==='Work'&&feed.skip.length===1&&feed.prio==='high'&&imp.every(c=>c.priority==='high'&&c.kind==='event'));
const dstCheck=imp.filter(c=>c.title==='Standup'&&c.date>'2026-11-01');
ok('weekly 10:00 stays 10:00 after DST ends Nov 1', dstCheck.length>0&&dstCheck.every(c=>c.time==='10:00'));
ok('notice + linked list', d.body.textContent.includes('Linked Work')&&[...d.querySelectorAll('.crow')].some(r=>r.textContent.includes('Work')&&r.textContent.includes('Google Calendar')));
// resync: Dentist moved, birthday deleted
ics=G('200000Z',false);
await click('[data-feedsync="'+feed.id+'"]'); await tick(); await tick();
st=puts.at(-1).state; const imp2=st.commitments.filter(c=>c.src==='feed:'+feed.id);
ok('resync: moved event updated (4:00 PM)', imp2.find(c=>c.title==='Dentist').time==='16:00');
ok('resync: deleted event removed', !imp2.some(c=>c.title==="Mom's birthday"));
ok('resync: unchecked stays skipped + no duplicates', imp2.length===imp.length-1 && new Set(imp2.map(c=>c.id)).size===imp2.length);
// Outlook file upload
await click('[data-callink="outlook"]'); await click('[data-calmode="file"]');
ok('outlook file steps', d.querySelector('.dialog').textContent.includes('Save Calendar'));
const fin=d.querySelector('[data-calfile]'); Object.defineProperty(fin,'files',{value:[new W.File([O],'Band.ics',{type:'text/calendar'})]});
fin.dispatchEvent(new W.Event('change',{bubbles:true})); await tick(); await tick();
ok('outlook preview count ('+expO.length+')', d.querySelectorAll('.prev-list li').length===expO.length);
await click('[data-calimport]'); await tick();
st=puts.at(-1).state; const oi=st.commitments.filter(c=>(c.src||'').startsWith('file:outlook'));
const c2=same(oi.map(c=>({t:c.title,k:c.date,h:c.time})),expO);
ok('Windows time zones: 7 PM Eastern, 9 AM Pacific -> noon', c2.ok, JSON.stringify({got:c2.g,exp:c2.e}));
// calendar page chip + today
await click('[data-tab="cal"]');
ok('calendar page has compact buttons', d.querySelectorAll('.cal-links.compact .cal-link').length===2);
// unlink
await click('[data-tab="commitments"]'); await click('[data-feedunlink="'+feed.id+'"]'); await click('[data-feedunlink="'+feed.id+'"]'); await tick();
st=puts.at(-1).state;
ok('unlink removes feed + its upcoming events', !(st.feeds||[]).length&&!st.commitments.some(c=>c.src==='feed:'+feed.id));
ok('outlook file events untouched by unlink', st.commitments.filter(c=>(c.src||'').startsWith('file:outlook')).length===expO.length);
ok('no runtime errors',!errors.length); if(errors.length)console.log(errors);
W.close();
// ---------- server ----------
const {sessionValue}=await import(U('lib/sign.js'));
const db={'dbd:state':JSON.stringify({...S,feeds:[{id:'f1',name:'Work',provider:'google',url:'https://calendar.google.com/secret',skip:['a']}]})};
const fetched=[];
globalThis.fetch=async(u,o)=>{ if(String(u)==='https://r'){const [c,k]=JSON.parse(o.body);return {json:async()=>({result:db[k]??null})};}
  fetched.push(String(u)); if(String(u).includes('redirect'))return {status:302,ok:false,headers:{get:()=>'https://evil.example.com/x.ics'}};
  return {status:200,ok:true,headers:{get:()=>null},text:async()=>'BEGIN:VCALENDAR\r\nEND:VCALENDAR'};};
const mk=()=>({statusCode:200,headers:{},body:null,status(c){this.statusCode=c;return this},setHeader(k,v){this.headers[k]=v},json(b){this.body=b;return this},send(b){this.body=b;return this}});
const stateH=(await import(U('api/state.js'))).default, icsH=(await import(U('api/ics.js'))).default;
const cookie='dbd_session='+sessionValue();
let r=mk();await stateH({method:'GET',headers:{},query:{token:'rt'}},r);
ok('view-only reader never sees calendar URL', r.statusCode===200&&!JSON.stringify(r.body).includes('calendar.google.com/secret')&&r.body.state.feeds[0].name==='Work');
r=mk();await stateH({method:'GET',headers:{cookie},query:{}},r); ok('owner still gets it', JSON.stringify(r.body).includes('calendar.google.com/secret'));
r=mk();await icsH({headers:{},query:{url:'https://calendar.google.com/x'}},r); ok('ics: owner only', r.statusCode===401);
r=mk();await icsH({headers:{cookie},query:{url:'https://evil.example.com/x.ics'}},r); ok('ics: refuses other hosts', r.statusCode===400&&!fetched.length);
r=mk();await icsH({headers:{cookie},query:{url:'http://calendar.google.com/x'}},r); ok('ics: refuses plain http', r.statusCode===400);
r=mk();await icsH({headers:{cookie},query:{url:'webcal://outlook.live.com/owa/calendar/abc/calendar.ics'}},r); ok('ics: webcal converted + fetched', r.statusCode===200&&fetched[0]==='https://outlook.live.com/owa/calendar/abc/calendar.ics');
r=mk();await icsH({headers:{cookie},query:{url:'https://calendar.google.com/redirect'}},r); ok('ics: blocks redirect to other host', r.statusCode===400&&!fetched.includes('https://evil.example.com/x.ics'));
console.log(out.join('\n'));console.log(out.filter(x=>x.startsWith('FAIL')).length+' failed of '+out.length);process.exit(0);

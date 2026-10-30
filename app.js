const STORAGE_KEY="missionChristmas_v1";
const $=s=>document.querySelector(s);
let database=[],store={version:1,seasons:{}},viewYear=new Date().getFullYear(),testDate=null,activeDay=null;
const localNow=()=>testDate?new Date(`${testDate}T12:00:00`):new Date();
const seasonKey=y=>String(y);
function readStore(){try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const p=JSON.parse(raw);if(p&&p.version===1&&p.seasons)store=p;}}catch(e){console.warn("Could not read saved game",e)}}
function saveStore(){localStorage.setItem(STORAGE_KEY,JSON.stringify(store))}
function shuffle(a){const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}
function ensureSeason(y){const k=seasonKey(y);if(!store.seasons[k]){const selected=shuffle(database).slice(0,25);store.seasons[k]={year:y,assignments:selected.map((c,i)=>({day:i+1,challengeId:c.id,result:null,completedAt:null}))};saveStore()}return store.seasons[k]}
function season(){return ensureSeason(viewYear)}
function todayParts(){const d=localNow();return {year:d.getFullYear(),month:d.getMonth()+1,day:d.getDate()}}
function isUnlocked(day,y){const t=todayParts();if(y<t.year)return true;if(y>t.year)return false;return t.month===12&&t.day>=day}
function isFinale(y){
  const t=todayParts();
  const seasonData=store.seasons[seasonKey(y)];
  const christmasDay=seasonData?.assignments?.find(a=>a.day===25);
  const christmasChallengeCompleted=!!christmasDay?.result;
  const christmasDateHasArrived=(y<t.year)||(y===t.year&&t.month===12&&t.day>=25);
  return christmasDateHasArrived&&christmasChallengeCompleted;
}
function challengeFor(a){return database.find(c=>c.id===a.challengeId)}
function render(){const s=season(),t=todayParts();$("#seasonLabel").textContent=`DECEMBER ${viewYear}`;$("#yearDisplay").textContent=viewYear;$("#prevYear").disabled=!Object.keys(store.seasons).some(y=>+y<viewYear);$("#nextYear").disabled=viewYear>=t.year;const recorded=s.assignments.filter(a=>a.result).length;$("#progressCount").textContent=recorded;$("#progressBar").style.width=`${recorded*4}%`;
const reveal=isFinale(viewYear);$("#scoreStatus").textContent=reveal?"DECLASSIFIED":"CLASSIFIED";$("#scoreHint").textContent=reveal?"The mission has been revealed.":"Final score revealed on Christmas Day.";
const cal=$("#calendar");cal.innerHTML="";s.assignments.forEach(a=>{const c=challengeFor(a),unlocked=isUnlocked(a.day,viewYear),done=!!a.result;const b=document.createElement("button");b.className="door"+(!unlocked?" locked":"")+(done?" completed":"")+(unlocked&&!done&&todayParts().year===viewYear&&todayParts().month===12&&todayParts().day===a.day?" current":"");b.disabled=!unlocked;b.innerHTML=`<span class="door-number">DAY ${String(a.day).padStart(2,"0")}</span><span class="door-title">${unlocked?escapeHtml(c.title):"Sealed assignment"}</span><span class="door-bottom"><span>${unlocked?c.coins+" COINS":"LOCKED"}</span><span class="status-mark">${done?(a.result==="success"?"✓":"×"):unlocked?"OPEN ↗":"•"}</span></span>`;b.addEventListener("click",()=>openChallenge(a.day));cal.appendChild(b)});
$("#finale").classList.toggle("hidden",!reveal);if(reveal)renderFinale(s);$("#seasonSelect").innerHTML=Object.keys(store.seasons).sort((a,b)=>b-a).map(y=>`<option value="${y}" ${+y===viewYear?"selected":""}>December ${y}</option>`).join("");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function openChallenge(day){const a=season().assignments.find(x=>x.day===day),c=challengeFor(a);activeDay=day;$("#challengeContent").innerHTML=`<div class="challenge-kicker">MISSION FILE · DECEMBER ${viewYear} · DAY ${String(day).padStart(2,"0")}</div><h2 id="modalTitle">${escapeHtml(c.title)}</h2><p class="challenge-desc">${escapeHtml(c.description)}</p><div class="challenge-meta"><span class="pill">${escapeHtml(c.category)}</span><span class="pill">${escapeHtml(c.difficulty.toUpperCase())}</span><span class="pill">${c.estimatedMinutes} MIN</span><span class="pill coin-pill">${c.coins} COINS</span></div><p class="challenge-instructions">${escapeHtml(c.instructions)}</p><p class="items-title">REQUIRED ITEMS</p><ul class="items-list">${c.items.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>${c.requiresPurchase?'<p class="safety-note">This challenge may require an item you do not already have.</p>':""}<p class="safety-note">Safety first: use a clear workspace, handle scissors carefully and ask an adult for help with any item or setup you are unsure about. Never throw objects at people or animals.</p>${a.result?`<div class="recorded"><strong>RESULT RECORDED: ${a.result.toUpperCase()}</strong><br>${a.result==="success"?"+":"−"}${c.coins} coins ${viewYear===todayParts().year&&!isFinale(viewYear)?"· Your score remains classified.":""}<br><small>${new Date(a.completedAt).toLocaleString()}</small></div>`:`<div class="result-actions"><button class="success-button" id="successBtn">I SUCCEEDED · +${c.coins}</button><button class="fail-button" id="failBtn">I FAILED · −${c.coins}</button></div>`}`;
if(!a.result){$("#successBtn").onclick=()=>recordResult(day,"success");$("#failBtn").onclick=()=>recordResult(day,"failure")}$("#challengeModal").classList.remove("hidden")}
function recordResult(day,result){const a=season().assignments.find(x=>x.day===day);if(a.result)return;a.result=result;a.completedAt=new Date().toISOString();saveStore();render();openChallenge(day);toast(result==="success"?"Success recorded. Mission progress updated.":"Failure recorded. Mission progress updated.")}
function renderFinale(s){let earned=0,lost=0,success=0,failed=0;s.assignments.forEach(a=>{if(a.result==="success"){success++;earned+=challengeFor(a).coins}else if(a.result==="failure"){failed++;lost+=challengeFor(a).coins}});$("#finalScore").textContent=(earned-lost).toLocaleString();$("#finalStats").innerHTML=[["SUCCESSFUL",success],["FAILED",failed],["COINS EARNED",earned],["COINS LOST",lost]].map(([l,v])=>`<div class="stat"><strong>${v}</strong><span>${l}</span></div>`).join("")}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2300)}
function closeModals(){$("#challengeModal").classList.add("hidden");$("#settingsModal").classList.add("hidden")}
document.addEventListener("click",e=>{if(e.target.matches("[data-close]")||e.target.matches("[data-close-settings]"))closeModals()});
$("#settingsBtn").onclick=()=>{$("#settingsModal").classList.remove("hidden");$("#testDate").value=testDate||""};
$("#prevYear").onclick=()=>{const years=Object.keys(store.seasons).map(Number).filter(y=>y<viewYear);if(years.length){viewYear=Math.max(...years);render()}};
$("#nextYear").onclick=()=>{const y=viewYear+1;if(y<=todayParts().year){viewYear=y;ensureSeason(y);render()}};
$("#seasonSelect").onchange=e=>{viewYear=Number(e.target.value);render()};
$("#applyDate").onclick=()=>{testDate=$("#testDate").value||null;viewYear=todayParts().year;ensureSeason(viewYear);render();toast(testDate?"Preview date applied.":"Using your device date.");};
$("#resetBtn").onclick=()=>{if(confirm(`Delete all recorded results for December ${viewYear}? This cannot be undone.`)){const s=season();s.assignments.forEach(a=>{a.result=null;a.completedAt=null});saveStore();render();closeModals();toast("This season's results have been reset.")}};
async function init(){try{const r=await fetch("data/challenges.json");if(!r.ok)throw Error("Challenge database unavailable");database=await r.json();if(database.length!==1000)throw Error("Challenge database must contain exactly 1,000 entries");readStore();viewYear=todayParts().year;ensureSeason(viewYear);render();if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js").catch(console.warn)}catch(e){document.body.innerHTML=`<main style="padding:3rem;font-family:sans-serif"><h1>Mission: Christmas</h1><p>Could not load the challenge database. Please run this site through a local web server, not by opening the HTML file directly.</p><pre>${escapeHtml(e.message)}</pre></main>`}}
init();

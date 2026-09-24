/* 99 Club Studio · Online Play core v2.0.1
 * Multi-game hub + shared play shell for interactive puzzle adapters.
 */
(function(global){
'use strict';
const ROOT_ID='tt99-play-root',STORE_PREFIX='tt99-games-play-v2',adapters=new Map();
function analyticsAttribution(){
  let integrationId='',sourceOrigin='';
  try{
    const raw=new URLSearchParams(global.location.search).get('via')||'';
    if(/^wid_[a-z0-9]{8,32}$/i.test(raw))integrationId=raw.toLowerCase();
  }catch(_){}
  try{
    const ref=String(global.document?.referrer||'');
    if(ref){
      const origin=new URL(ref).origin;
      if(/^https?:\/\//i.test(origin)&&origin!==global.location.origin)sourceOrigin=origin;
    }
  }catch(_){}
  const appMode=(global.matchMedia?.('(display-mode: standalone)').matches||global.navigator?.standalone===true)?'pwa':'browser';
  return {integration_id:integrationId||undefined,source_origin:sourceOrigin||undefined,app_mode:appMode};
}
const PLAY_ATTRIBUTION=analyticsAttribution();
const track=(name,params)=>global.TT99Analytics?.track(name,{...PLAY_ATTRIBUTION,...(params||{})});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=x=>JSON.parse(JSON.stringify(x));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function safeGet(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v??fallback;}catch(_){return fallback;}}
function safeSet(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}}
function randomSeed(){const a=new Uint32Array(2);if(global.crypto?.getRandomValues)global.crypto.getRandomValues(a);else{a[0]=Math.random()*2**32;a[1]=Date.now();}return `${Date.now().toString(36)}-${a[0].toString(36)}${a[1].toString(36)}`;}
function fmtTime(ms){const sec=Math.max(0,Math.floor(ms/1000)),m=Math.floor(sec/60),s=sec%60;return `${m}:${String(s).padStart(2,'0')}`;}
function query(){return new URLSearchParams(global.location.search);}
function copyText(text){if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();return Promise.resolve();}
function registerAdapter(id,obj){if(!id||!obj)return;adapters.set(id,obj);}
function adapter(){return state.adapter;}
function gameList(){return [...adapters.values()].sort((a,b)=>(a.order??99)-(b.order??99)||String(a.title).localeCompare(String(b.title)));}
const state={adapter:null,config:null,seed:'',puzzle:null,view:null,history:[],redo:[],snapshot:null,mode:'relaxed',started:false,paused:false,startAt:0,elapsed:0,timerId:0,hints:0,finished:false,revealed:false,completion:null,libraryOpen:false};
let hintPopupPos=null,hintDrag=null,hintSuppressClick=false,analyticsPuzzleKey='';
function timerMs(){return state.elapsed+(state.started&&!state.paused&&!state.finished?(performance.now()-state.startAt):0);}
function startTimer(){if(state.mode!=='challenge'||state.started||state.finished||state.paused)return;state.started=true;state.startAt=performance.now();tick();}
function stopTimer(){if(state.started&&!state.paused)state.elapsed+=performance.now()-state.startAt;state.started=false;clearInterval(state.timerId);state.timerId=0;tick();}
function pauseTimer(){if(state.mode!=='challenge'||state.finished)return;if(!state.paused){if(state.started){state.elapsed+=performance.now()-state.startAt;state.started=false;}state.paused=true;}else{state.paused=false;state.started=true;state.startAt=performance.now();}tick();renderPause();}
function tick(){document.getElementById('tt99-play-timer')?.replaceChildren(document.createTextNode(fmtTime(timerMs())));const p=document.getElementById('tt99-play-pause');if(p)p.textContent=state.paused?'Resume':'Pause';}
function ensureTicker(){clearInterval(state.timerId);if(state.mode==='challenge'&&!state.finished)state.timerId=setInterval(tick,250);}
function hintPopup(){return document.getElementById('tt99-play-hint-popup');}
function clampHintPosition(x,y,popup){
  const r=popup.getBoundingClientRect(),m=10;
  return {x:Math.max(m,Math.min(global.innerWidth-r.width-m,x)),y:Math.max(m,Math.min(global.innerHeight-r.height-m,y))};
}
function placeHintPopup(force=false){
  const popup=hintPopup();if(!popup||popup.hidden)return;
  requestAnimationFrame(()=>{
    if(!popup||popup.hidden)return;
    if(hintPopupPos&&!force){const p=clampHintPosition(hintPopupPos.x,hintPopupPos.y,popup);hintPopupPos=p;popup.style.left=p.x+'px';popup.style.top=p.y+'px';return;}
    const trigger=document.getElementById('tt99-play-hint'),tools=document.querySelector('.tt99-play-tools'),pr=popup.getBoundingClientRect(),tr=trigger?.getBoundingClientRect(),ar=tools?.getBoundingClientRect();
    let x=12,y=12;
    if(global.innerWidth>820&&ar){x=ar.left;y=(tr?.bottom||ar.top)+10;}
    else if(tr){x=tr.right-pr.width;y=tr.top-pr.height-10;if(y<10)y=tr.bottom+10;}
    const p=clampHintPosition(x,y,popup);hintPopupPos=p;popup.style.left=p.x+'px';popup.style.top=p.y+'px';
  });
}
function showHintPopup(text){
  const popup=hintPopup(),body=document.getElementById('tt99-play-hint-popup-text');if(!popup||!body)return;
  body.textContent=text||'Hint shown.';popup.hidden=false;placeHintPopup(!hintPopupPos);
}
function hideHintPopup(){
  const popup=hintPopup();if(popup)popup.hidden=true;hintDrag=null;hintSuppressClick=false;
}
function setStatus(text,tone=''){
  if(tone==='hint'){showHintPopup(text);const el=document.getElementById('tt99-play-status');if(el){el.textContent='';el.dataset.tone='';}return;}
  const el=document.getElementById('tt99-play-status');if(el){el.textContent=text||'';el.dataset.tone=tone;}
}
function currentRecordKey(){return `${STORE_PREFIX}:best:${adapter()?.id||'game'}:${adapter()?.recordKey?.(state.config)||JSON.stringify(state.config||{})}`;}
function getBest(){return safeGet(currentRecordKey(),null);}
function getStreak(){return Number(safeGet(`${STORE_PREFIX}:streak`,0))||0;}
function saveCompletion(){const streak=getStreak()+1;safeSet(`${STORE_PREFIX}:streak`,streak);let best=getBest(),isBest=false;if(state.mode==='challenge'&&state.hints===0){const time=Math.round(timerMs());if(!best||time<best.time){best={time,at:new Date().toISOString()};safeSet(currentRecordKey(),best);isBest=true;}}return {streak,best,isBest};}
function renderStats(){const best=getBest();const b=document.getElementById('tt99-play-best'),s=document.getElementById('tt99-play-streak');if(b)b.textContent=best?fmtTime(best.time):'—';if(s)s.textContent=String(getStreak());}
function urlForCurrent(){const u=new URL(global.location.href);u.search='';const params=adapter().toQuery?adapter().toQuery(state.config):{};u.searchParams.set('game',adapter().id);u.searchParams.set('seed',state.seed);u.searchParams.set('mode',state.mode);for(const [k,v] of Object.entries(params||{}))u.searchParams.set(k,String(v));return u.toString();}
function syncUrl(){try{history.replaceState(null,'',urlForCurrent());}catch(_){}}
function renderPause(){const overlay=document.getElementById('tt99-play-paused');if(overlay)overlay.hidden=!state.paused;const board=document.getElementById('tt99-play-board');if(board)board.classList.toggle('is-paused',state.paused);}
function updateUndoButtons(){const u=document.getElementById('tt99-play-undo'),r=document.getElementById('tt99-play-redo');if(u)u.disabled=!state.history.length;if(r)r.disabled=!state.redo.length;}
function clearHistory(){state.history=[];state.redo=[];state.snapshot=state.view?.snapshot?clone(state.view.snapshot()):null;updateUndoButtons();}
function onAdapterChange(next){if(state.finished||state.paused)return;startTimer();const now=clone(next);if(state.snapshot&&!same(now,state.snapshot)){state.history.push(clone(state.snapshot));if(state.history.length>100)state.history.shift();state.redo=[];state.snapshot=now;updateUndoButtons();}updateProgress();const result=state.view?.check?.({silent:true});if(result?.complete)finish(result);}
function updateProgress(){const el=document.getElementById('tt99-play-progress');if(el)el.textContent=state.view?.progress?.()||'';}
function undo(){if(!state.history.length||state.finished||state.paused)return;startTimer();state.redo.push(clone(state.snapshot));const prev=state.history.pop();state.view.restore(clone(prev));state.snapshot=clone(prev);updateUndoButtons();updateProgress();setStatus('Last move undone.');}
function redo(){if(!state.redo.length||state.finished||state.paused)return;startTimer();state.history.push(clone(state.snapshot));const next=state.redo.pop();state.view.restore(clone(next));state.snapshot=clone(next);updateUndoButtons();updateProgress();setStatus('Move restored.');}
function reset(){if(state.finished||state.paused)return;const empty=state.view?.emptySnapshot?.();if(empty==null)return;if(state.snapshot&&!same(state.snapshot,empty))state.history.push(clone(state.snapshot));state.redo=[];state.view.restore(clone(empty));state.snapshot=clone(empty);updateUndoButtons();updateProgress();setStatus('Puzzle reset.');}
function hint(){if(state.finished||state.paused)return;startTimer();state.hints++;track('online_hint_used',{game_id:adapter()?.id||'unknown',difficulty:state.config?.difficulty||'default',play_mode:state.mode,hint_number:state.hints});const result=state.view?.hint?.()||{};setStatus(result.message||'Hint shown.',result.tone||'hint');const h=document.getElementById('tt99-play-hints');if(h)h.textContent=String(state.hints);}
function check(){if(state.finished||state.paused)return;startTimer();const result=state.view?.check?.({silent:false})||{};setStatus(result.message||'Checked.',result.complete?'success':result.wrong?'warn':'');if(result.complete)finish(result);}
function renderAnswerReveal(){
  const wrap=document.getElementById('tt99-play-answer-reveal'),open=document.getElementById('tt99-play-reveal-open'),confirm=document.getElementById('tt99-play-reveal-confirm'),note=document.getElementById('tt99-play-reveal-note');
  if(!wrap)return;
  const supported=typeof state.view?.revealAnswer==='function';
  wrap.hidden=!supported||(state.finished&&!state.revealed);
  if(open)open.hidden=state.revealed;
  if(confirm)confirm.hidden=true;
  if(note)note.hidden=!state.revealed;
}
function openAnswerReveal(){
  if(state.finished||typeof state.view?.revealAnswer!=='function')return;
  const open=document.getElementById('tt99-play-reveal-open'),confirm=document.getElementById('tt99-play-reveal-confirm');
  if(open)open.hidden=true;if(confirm)confirm.hidden=false;
}
function cancelAnswerReveal(){
  if(state.finished)return;
  const open=document.getElementById('tt99-play-reveal-open'),confirm=document.getElementById('tt99-play-reveal-confirm');
  if(open)open.hidden=false;if(confirm)confirm.hidden=true;
}
function revealAnswers(){
  if(state.finished||typeof state.view?.revealAnswer!=='function')return;
  try{
    const shown=state.view.revealAnswer();
    if(shown===false){cancelAnswerReveal();setStatus('The answer could not be shown for this puzzle.','warn');return;}
  }catch(err){
    console.error(err);cancelAnswerReveal();setStatus('The answer could not be shown for this puzzle.','warn');return;
  }
  hideHintPopup();
  if(state.paused){state.paused=false;renderPause();}
  stopTimer();
  state.revealed=true;
  state.finished=true;
  state.completion=null;
  state.history=[];
  state.redo=[];
  state.snapshot=clone(state.view.snapshot?.());
  state.view?.setFinished?.(true);
  updateUndoButtons();
  updateProgress();
  renderAnswerReveal();
  track('online_answer_revealed',{game_id:adapter()?.id||'unknown',difficulty:state.config?.difficulty||'default',play_mode:state.mode});
  setStatus('Answers revealed. This attempt will not count towards your streak or personal best.');
}
function dismissCompletionInput(){try{global.document?.activeElement?.blur?.();}catch(_){}try{global.TT99ContextKeypad?.hide?.();}catch(_){}const board=document.getElementById('tt99-play-board');board?.classList.remove('tt99-has-context-pad','tt99-context-pad-reserve');board?.style.removeProperty('--tt99-context-pad-space');board?.querySelectorAll?.('.tt99-context-pad-active,.tt99-context-pad-collapsed,.tt99-context-pad-dragging').forEach(el=>el.classList.remove('tt99-context-pad-active','tt99-context-pad-collapsed','tt99-context-pad-dragging'));}
function finish(result){if(state.finished)return;hideHintPopup();state.finished=true;state.revealed=false;stopTimer();const saved=saveCompletion(),time=timerMs();state.completion={time,saved,result,hints:state.hints};track('online_game_completed',{game_id:adapter()?.id||'unknown',difficulty:state.config?.difficulty||'default',play_mode:state.mode,hints_used:state.hints,duration_seconds:Math.round(time/1000),personal_best:saved.isBest?1:0});state.view?.setFinished?.(true);dismissCompletionInput();renderStats();renderAnswerReveal();renderCompletion();setStatus(adapter()?.completeMessage||'Puzzle solved!','success');}
function renderCompletion(){const box=document.getElementById('tt99-play-complete');if(!box||!state.completion)return;const {time,saved,hints}=state.completion,title=adapter()?.completionTitle||'Puzzle solved';box.hidden=false;box.innerHTML=`<div class="tt99-play-complete-card"><span class="tt99-play-complete-mark">✓</span><div><small>Puzzle complete</small><h2>${esc(title)}</h2><p>${state.mode==='challenge'?`Time <strong>${fmtTime(time)}</strong>${hints?` · ${hints} hint${hints===1?'':'s'}`:' · no hints'}.`:hints?`Solved with ${hints} hint${hints===1?'':'s'}.`:'Solved without hints.'} ${saved.isBest?'New personal best!':''}</p><p class="tt99-play-complete-streak">Current solved streak: <strong>${saved.streak}</strong></p><div class="tt99-play-complete-actions"><button type="button" class="tt99-primary" data-play-new>New puzzle</button><button type="button" class="tt99-secondary" data-play-surprise>Surprise me</button><button type="button" class="tt99-secondary" data-play-another>Choose another game</button><button type="button" class="tt99-secondary" data-play-share>Copy puzzle link</button></div></div></div>`;box.querySelector('[data-play-new]')?.addEventListener('click',()=>newPuzzle(true));box.querySelector('[data-play-surprise]')?.addEventListener('click',surprise);box.querySelector('[data-play-another]')?.addEventListener('click',()=>{box.hidden=true;openLibrary(true);});box.querySelector('[data-play-share]')?.addEventListener('click',share);}
function share(){copyText(urlForCurrent()).then(()=>setStatus('Challenge link copied. Anyone opening it gets the same puzzle.','success')).catch(()=>setStatus('Could not copy the link in this browser.','warn'));}
function savedConfigFor(a){return safeGet(`${STORE_PREFIX}:config:${a.id}`,{});}
function persistConfig(){safeSet(`${STORE_PREFIX}:config:${adapter().id}`,state.config);safeSet(`${STORE_PREFIX}:mode`,state.mode);safeSet(`${STORE_PREFIX}:lastGame`,adapter().id);}
function parseInitial(a){const q=query(),fromUrl=q.get('game')===a.id&&a.fromQuery?a.fromQuery(q):{},saved=savedConfigFor(a),hasShare=!!(q.get('seed')&&q.get('game')===a.id),config=a.normalizeConfig?.({...saved,...fromUrl})||{...saved,...fromUrl};return {config,seed:hasShare?q.get('seed'):randomSeed()};}
function gameIcon(a){return a.icon||'▦';}
function gameCard(a){return `<button type="button" class="tt99-play-game-card${a.id===adapter()?.id?' is-active':''}" data-game-id="${esc(a.id)}"><span class="tt99-play-game-icon" aria-hidden="true">${esc(gameIcon(a))}</span><span><strong>${esc(a.shortTitle||a.title)}</strong><small>${esc(a.category||'Maths puzzle')}</small><em>${esc(a.blurb||'Play a fresh puzzle online.')}</em></span>${a.id===adapter()?.id?'<b>Playing</b>':''}</button>`;}
function renderLibrary(filter=''){const host=document.getElementById('tt99-play-library-grid');if(!host)return;const q=String(filter||'').trim().toLowerCase(),list=gameList().filter(a=>!q||`${a.title} ${a.category||''} ${a.blurb||''}`.toLowerCase().includes(q));host.innerHTML=list.map(gameCard).join('')||'<p class="tt99-play-empty">No games match that search.</p>';host.querySelectorAll('[data-game-id]').forEach(btn=>btn.addEventListener('click',()=>switchGame(btn.dataset.gameId)));}
function openLibrary(force){state.libraryOpen=force===undefined?!state.libraryOpen:!!force;const panel=document.getElementById('tt99-play-library');if(panel)panel.hidden=!state.libraryOpen;const btn=document.getElementById('tt99-play-change-game');if(btn)btn.setAttribute('aria-expanded',String(state.libraryOpen));if(state.libraryOpen){const search=document.getElementById('tt99-play-library-search');if(search){search.value='';renderLibrary('');setTimeout(()=>search.focus(),0);}}}
function surprise(){const list=gameList().filter(a=>a.id!==adapter()?.id);if(!list.length)return;switchGame(list[Math.floor(Math.random()*list.length)].id);}
function updateGameHeader(){const a=adapter(),title=document.getElementById('tt99-play-game-title'),cat=document.getElementById('tt99-play-game-category'),icon=document.getElementById('tt99-play-current-icon'),howTitle=document.getElementById('tt99-play-how-title'),howText=document.getElementById('tt99-play-how-text');if(title)title.textContent=a.title;if(cat)cat.textContent=a.category||'Online puzzle';if(icon)icon.textContent=gameIcon(a);if(howTitle)howTitle.textContent=a.howTitle||'How to play';if(howText)howText.textContent=a.howText||a.instruction||'';}
function switchGame(id){const next=adapters.get(id);if(!next||next===adapter())return openLibrary(false);state.view?.destroy?.();stopTimer();state.adapter=next;const initial=parseInitial(next);state.config=initial.config;state.seed=randomSeed();state.finished=false;state.paused=false;state.libraryOpen=false;persistConfig();updateGameHeader();renderOptions();renderLibrary('');openLibrary(false);mountPuzzle();}
function renderMode(){document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('is-active',b.dataset.mode===state.mode));const wrap=document.querySelector('.tt99-play-timer-wrap');if(wrap)wrap.hidden=state.mode!=='challenge';}
function renderOptions(){const host=document.getElementById('tt99-play-options');if(!host)return;adapter().renderOptions(host,state.config,next=>{state.config=adapter().normalizeConfig(next);persistConfig();state.seed=randomSeed();renderOptions();mountPuzzle();});}
function buildShell(){const root=document.getElementById(ROOT_ID);if(!root)return;root.innerHTML=`<div class="tt99-play-shell"><header class="tt99-play-hero"><div><span class="tt99-eyebrow">99 Club Studio · Maths Games &amp; Puzzles</span><h1>Play Online</h1><p>Fresh maths puzzles for quick practice. Choose a game, play in Relaxed mode or race your own best time in Challenge mode.</p></div><nav><a href="/games/">← Printable games</a><a href="/help/games/">Help</a></nav></header><section class="tt99-play-gamebar"><div class="tt99-play-current"><span id="tt99-play-current-icon" class="tt99-play-game-icon" aria-hidden="true"></span><div><small id="tt99-play-game-category"></small><h2 id="tt99-play-game-title"></h2></div></div><div class="tt99-play-gamebar-actions"><button type="button" id="tt99-play-change-game" aria-expanded="false">Change game</button><button type="button" id="tt99-play-surprise">Surprise me</button><span>${gameList().length} games</span></div></section><section id="tt99-play-library" class="tt99-play-library" hidden><div class="tt99-play-library-head"><div><small>Game library</small><h2>Choose what to play</h2></div><button type="button" id="tt99-play-library-close" aria-label="Close game library">×</button></div><label class="tt99-play-search"><span>Search games</span><input id="tt99-play-library-search" type="search" placeholder="Try ‘logic’, ‘number’, ‘picture’…"></label><div id="tt99-play-library-grid" class="tt99-play-library-grid"></div></section><section class="tt99-play-setup"><div class="tt99-play-mode" role="group" aria-label="Play mode"><button type="button" data-mode="relaxed">Relaxed<span>No timer pressure</span></button><button type="button" data-mode="challenge">Challenge<span>Timer + personal best</span></button></div><details class="tt99-play-settings"><summary>Puzzle settings</summary><div id="tt99-play-options" class="tt99-play-options"></div></details><div class="tt99-play-setup-actions"><button type="button" class="tt99-primary" id="tt99-play-new">New puzzle</button><button type="button" class="tt99-secondary" id="tt99-play-share">Copy challenge link</button></div></section><section class="tt99-play-stage"><div class="tt99-play-board-card"><div class="tt99-play-board-head"><div><strong id="tt99-play-progress"></strong><span id="tt99-play-puzzle-meta"></span></div><div class="tt99-play-timer-wrap"><span class="tt99-play-timer-label">Time</span><strong id="tt99-play-timer">0:00</strong><button type="button" id="tt99-play-pause">Pause</button></div></div><div class="tt99-play-board-wrap"><div id="tt99-play-board"></div><div id="tt99-play-paused" class="tt99-play-paused" hidden><strong>Paused</strong><span>Your puzzle is hidden until you resume.</span></div></div><p id="tt99-play-instruction" class="tt99-play-instruction"></p></div><aside class="tt99-play-tools"><div class="tt99-play-tool-row"><button type="button" id="tt99-play-undo">↶ Undo</button><button type="button" id="tt99-play-redo">↷ Redo</button></div><div class="tt99-play-tool-row"><button type="button" id="tt99-play-reset">Reset</button><button type="button" id="tt99-play-hint">Hint</button><button type="button" id="tt99-play-check">Check</button></div><div class="tt99-play-stats"><div><span>Personal best</span><strong id="tt99-play-best">—</strong></div><div><span>Solved streak</span><strong id="tt99-play-streak">0</strong></div><div><span>Hints</span><strong id="tt99-play-hints">0</strong></div></div><div class="tt99-play-how"><strong id="tt99-play-how-title">How to play</strong><p id="tt99-play-how-text"></p></div></aside></section><div id="tt99-play-status" class="tt99-play-status" role="status" aria-live="polite"></div><div id="tt99-play-answer-reveal" class="tt99-play-answer-reveal" hidden><button type="button" id="tt99-play-reveal-open" class="tt99-play-reveal-link">Show answers</button><div id="tt99-play-reveal-confirm" class="tt99-play-reveal-confirm" hidden><span>Are you sure? This will reveal the complete answer and end this attempt.</span><button type="button" id="tt99-play-reveal-cancel">Cancel</button><button type="button" id="tt99-play-reveal-confirm-btn">Reveal answers</button></div><p id="tt99-play-reveal-note" hidden>Answers shown · this attempt does not count towards your streak or personal best. Start a new puzzle to try again.</p></div><div id="tt99-play-hint-popup" class="tt99-play-hint-popup" role="status" aria-live="polite" hidden><div class="tt99-play-hint-popup-head" data-hint-drag><span class="tt99-play-hint-grip" aria-hidden="true"></span><strong>Hint</strong><small>Drag to move</small><button type="button" id="tt99-play-hint-popup-close" aria-label="Close hint">×</button></div><p id="tt99-play-hint-popup-text"></p></div><div id="tt99-play-complete" class="tt99-play-complete" hidden></div></div>`;}
function mountPuzzle(){const board=document.getElementById('tt99-play-board');if(!board)return;hideHintPopup();state.view?.destroy?.();board.className='';board.innerHTML='';state.finished=false;state.revealed=false;state.completion=null;state.history=[];state.redo=[];state.started=false;state.paused=false;state.elapsed=0;state.hints=0;clearInterval(state.timerId);const done=document.getElementById('tt99-play-complete');if(done)done.hidden=true;const hc=document.getElementById('tt99-play-hints');if(hc)hc.textContent='0';try{state.puzzle=adapter().createPuzzle(state.config,state.seed);state.view=adapter().mount(board,state.puzzle,{onChange:onAdapterChange,onStatus:setStatus,isPaused:()=>state.paused});const analyticsKey=(adapter()?.id||'unknown')+'|'+state.seed;if(analyticsKey!==analyticsPuzzleKey){analyticsPuzzleKey=analyticsKey;track('online_game_started',{game_id:adapter()?.id||'unknown',difficulty:state.config?.difficulty||'default',play_mode:state.mode});}}catch(err){console.error(err);board.innerHTML='<div class="tt99-play-load-error"><strong>Could not build this puzzle.</strong><span>Try New puzzle or choose another game.</span></div>';setStatus('Puzzle generation failed. Try New puzzle.','warn');return;}state.snapshot=clone(state.view.snapshot());clearHistory();updateProgress();const meta=document.getElementById('tt99-play-puzzle-meta');if(meta)meta.textContent=adapter().meta?.(state.puzzle,state.config)||'';const ins=document.getElementById('tt99-play-instruction');if(ins){const rule=adapter().instruction;ins.textContent=(typeof rule==='function'?rule(state.puzzle,state.config):rule)||state.puzzle?.instruction||'';}renderMode();renderPause();renderStats();renderAnswerReveal();tick();ensureTicker();syncUrl();renderLibrary('');setStatus('');}
function newPuzzle(freshSeed=true){if(freshSeed)state.seed=randomSeed();persistConfig();mountPuzzle();}
function bind(){
  document.getElementById('tt99-play-hint-popup-close')?.addEventListener('click',e=>{e.preventDefault();hideHintPopup();});
  document.addEventListener('pointerdown',e=>{
    const popup=hintPopup(),handle=e.target.closest?.('[data-hint-drag]');if(!popup||popup.hidden||!handle||!popup.contains(handle)||e.target.closest('button')||global.innerWidth<700)return;
    const r=popup.getBoundingClientRect();hintDrag={pointerId:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top,startX:e.clientX,startY:e.clientY,moved:false};popup.classList.add('is-dragging');try{handle.setPointerCapture?.(e.pointerId);}catch(_){}e.preventDefault();
  },{capture:true});
  document.addEventListener('pointermove',e=>{
    const popup=hintPopup();if(!hintDrag||!popup||e.pointerId!==hintDrag.pointerId)return;hintDrag.moved=hintDrag.moved||Math.hypot(e.clientX-hintDrag.startX,e.clientY-hintDrag.startY)>4;const p=clampHintPosition(e.clientX-hintDrag.dx,e.clientY-hintDrag.dy,popup);hintPopupPos=p;popup.style.left=p.x+'px';popup.style.top=p.y+'px';e.preventDefault();
  },{capture:true});
  const endHintDrag=e=>{if(!hintDrag||e.pointerId!==hintDrag.pointerId)return;hintSuppressClick=hintDrag.moved;hintDrag=null;hintPopup()?.classList.remove('is-dragging');};
  document.addEventListener('pointerup',endHintDrag,{capture:true});document.addEventListener('pointercancel',endHintDrag,{capture:true});
  global.addEventListener('resize',()=>{if(!hintPopup()?.hidden)placeHintPopup(false);});
  document.getElementById('tt99-play-reveal-open')?.addEventListener('click',openAnswerReveal);document.getElementById('tt99-play-reveal-cancel')?.addEventListener('click',cancelAnswerReveal);document.getElementById('tt99-play-reveal-confirm-btn')?.addEventListener('click',revealAnswers);document.getElementById('tt99-play-new')?.addEventListener('click',()=>newPuzzle(true));document.getElementById('tt99-play-share')?.addEventListener('click',share);document.getElementById('tt99-play-pause')?.addEventListener('click',pauseTimer);document.getElementById('tt99-play-undo')?.addEventListener('click',undo);document.getElementById('tt99-play-redo')?.addEventListener('click',redo);document.getElementById('tt99-play-reset')?.addEventListener('click',reset);document.getElementById('tt99-play-hint')?.addEventListener('click',hint);document.getElementById('tt99-play-check')?.addEventListener('click',check);document.getElementById('tt99-play-change-game')?.addEventListener('click',()=>openLibrary());document.getElementById('tt99-play-library-close')?.addEventListener('click',()=>openLibrary(false));document.getElementById('tt99-play-surprise')?.addEventListener('click',surprise);document.getElementById('tt99-play-library-search')?.addEventListener('input',e=>renderLibrary(e.target.value));document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode;safeSet(`${STORE_PREFIX}:mode`,state.mode);renderMode();mountPuzzle();}));}
function boot(){const root=document.getElementById(ROOT_ID);if(!root||root.dataset.playBooted==='1')return;const q=query(),wanted=q.get('game')||safeGet(`${STORE_PREFIX}:lastGame`,'shikaku'),a=adapters.get(wanted)||adapters.get('shikaku')||gameList()[0];if(!a){root.innerHTML='<p>Online play could not load. Please refresh the page.</p>';return;}root.dataset.playBooted='1';state.adapter=a;const initial=parseInitial(a);state.config=initial.config;state.seed=initial.seed;state.mode=['relaxed','challenge'].includes(q.get('mode'))?q.get('mode'):safeGet(`${STORE_PREFIX}:mode`,'relaxed');buildShell();updateGameHeader();renderOptions();renderLibrary('');bind();mountPuzzle();}
global.TT99GamesPlay={registerAdapter,boot,get adapters(){return adapters;},get gameList(){return gameList();}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,0);
})(typeof globalThis!=='undefined'?globalThis:this);

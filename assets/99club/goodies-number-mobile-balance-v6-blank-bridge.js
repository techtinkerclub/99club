/* Number Mobile v6 state bridge.
 * Keeps challenge-builder edits attached to the exact Number Mobile box the
 * builder selected, and protects the v6 Challenge trigger during redraws.
 */
(function(){
'use strict';

let builderTargetId=null,builderActive=false,builderTimer=null,bridgeDispatch=false;
let editQueue=Promise.resolve();

function markBuilderActive(){
  builderActive=true;builderTargetId=null;clearTimeout(builderTimer);
  builderTimer=setTimeout(()=>{builderActive=false;builderTargetId=null},5000);
}
function building(){return builderActive||document.body.classList.contains('nmb-v7-challenge-building')||document.documentElement.classList.contains('nmb-v7-challenge-building')}
function work(){return document.querySelector('#gd-stage .gd-number-mobile-workbench')}
function token(id){return work()?.querySelector('[data-ba-token="'+CSS.escape(String(id))+'"]')||null}
function wait(ms=6){return new Promise(resolve=>setTimeout(resolve,ms))}
async function waitFor(fn,tries=60){for(let i=0;i<tries;i++){const value=fn();if(value)return value;await wait()}return null}
function enqueue(task){editQueue=editQueue.then(task).catch(err=>console.error('Number Mobile builder bridge:',err));return editQueue}

function replayChallengeClick(attempt=0){
  const fresh=document.querySelector('#gd-stage .gd-number-mobile-workbench [data-nmb-challenge-toggle]');
  if(fresh?.dataset.nmbV6Bound){fresh.click();return}
  if(attempt<8)setTimeout(()=>replayChallengeClick(attempt+1),16);
}

async function focusTarget(id){
  const sid=String(id),tile=await waitFor(()=>token(sid));if(!tile)return false;
  if(tile.disabled){tile.disabled=false;tile.removeAttribute('disabled');tile.removeAttribute('aria-disabled')}
  tile.click();
  return !!(await waitFor(()=>document.querySelector('#gd-stage .gd-number-mobile-workbench .gd-eq-selected[data-ba-selected="'+CSS.escape(sid)+'"]')));
}

async function freshPad(id){
  const sid=String(id);
  return waitFor(()=>work()?.querySelector('.nmb-keypad[data-nmb-keypad="'+CSS.escape(sid)+'"]'));
}

async function dispatchBridgeChange(input){
  bridgeDispatch=true;
  try{input.dispatchEvent(new Event('change',{bubbles:true}))}
  finally{bridgeDispatch=false}
}

async function applyValue(id,value){
  const sid=String(id),text=String(value??'').trim();if(!/^\d+(?:\.\d+)?$/.test(text))return;
  if(!await focusTarget(sid))return;
  /* v3 redraws its keypad after each keypress. Always reacquire the live keypad
     and complete this entire edit before the next generated edit is allowed. */
  let pad=await freshPad(sid);
  if(pad){
    const blank=pad.querySelector('[data-nmb-blank]');if(blank){blank.click();await wait(8)}
    for(const key of text){
      pad=await freshPad(sid);if(!pad)break;
      const button=[...pad.querySelectorAll('[data-nmb-key]')].find(el=>el.dataset.nmbKey===key);
      if(!button)break;button.click();await wait(8);
    }
    pad=await freshPad(sid);pad?.querySelector('[data-nmb-done]')?.click();await wait(12);return;
  }
  const input=document.getElementById('ba-value');if(!input)return;
  input.value=text;await dispatchBridgeChange(input);await wait(12);
}

async function applyHidden(id,checked){
  const sid=String(id);if(!await focusTarget(sid))return;
  /* If a generated branch box still carries v3's blank state, synchronise its
     current engine value through the Number Mobile keypad before hiding it. */
  const tileNow=token(sid);
  if(tileNow?.classList.contains('is-blank-box')){
    const current=document.getElementById('ba-value')?.value;
    if(current!=null&&String(current).trim()!=='')await applyValue(sid,current);
    if(!await focusTarget(sid))return;
  }
  const hidden=await waitFor(()=>document.getElementById('ba-hidden'));if(!hidden)return;
  hidden.checked=!!checked;await dispatchBridgeChange(hidden);await wait(12);
}

/* v6 can run with or without v7's visual construction curtain. Treat the v6
 * challenge action itself as the canonical start of a builder transaction. */
document.addEventListener('click',event=>{
  if(event.target?.closest?.('[data-nmb-v6-type],[data-nmb-v6-another]'))markBuilderActive();
},true);

/* Capture the exact token selected by the async builder before any redraw can
 * shift focus. The captured id is copied into each queued edit immediately. */
document.addEventListener('click',event=>{
  const tile=event.target?.closest?.('[data-ba-token]');
  if(building()&&tile)builderTargetId=String(tile.dataset.baToken||'');
},true);

/* A redraw replaces the v4 Challenge button. Replay an early click after v6
 * has rebound the fresh node. */
document.addEventListener('click',event=>{
  const trigger=event.target?.closest?.('[data-nmb-challenge-toggle]');
  if(!trigger||trigger.dataset.nmbV6Bound)return;
  event.preventDefault();event.stopPropagation();
  setTimeout(()=>replayChallengeClick(),16);
},true);

/* Queue every generated value/hide operation. Never let a later builder edit
 * fall through merely because the previous keypad edit is still completing. */
document.addEventListener('change',event=>{
  if(!building()||bridgeDispatch||!builderTargetId)return;
  const input=event.target;if(!input)return;
  if(input.id==='ba-value'){
    const id=String(builderTargetId),value=input.value;
    event.preventDefault();event.stopImmediatePropagation();
    enqueue(()=>applyValue(id,value));
  }else if(input.id==='ba-hidden'){
    const id=String(builderTargetId),checked=input.checked;
    event.preventDefault();event.stopImmediatePropagation();
    enqueue(()=>applyHidden(id,checked));
  }
},true);
})();

/* Number Mobile v6 state bridge.
 * Keeps challenge-builder edits attached to the exact Number Mobile box the
 * builder selected, and protects the v6 Challenge trigger during redraws.
 */
(function(){
'use strict';

let builderTargetId=null,applying=false;

function building(){return document.body.classList.contains('nmb-v7-challenge-building')||document.documentElement.classList.contains('nmb-v7-challenge-building')}
function work(){return document.querySelector('#gd-stage .gd-number-mobile-workbench')}
function token(id){return work()?.querySelector('[data-ba-token="'+CSS.escape(String(id))+'"]')||null}
function wait(ms=12){return new Promise(resolve=>setTimeout(resolve,ms))}
async function waitFor(fn,tries=30){for(let i=0;i<tries;i++){const value=fn();if(value)return value;await wait()}return null}

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

async function applyValue(id,value){
  if(applying)return;applying=true;
  try{
    const sid=String(id),text=String(value??'').trim();if(!/^\d+(?:\.\d+)?$/.test(text))return;
    if(!await focusTarget(sid))return;
    /* Prefer the Number Mobile keypad because it updates both the engine value
       and v3's own blank-box state. Crucially, require the keypad to belong to
       the exact token the builder asked to edit. */
    const pad=await waitFor(()=>work()?.querySelector('.nmb-keypad[data-nmb-keypad="'+CSS.escape(sid)+'"]'));
    if(pad){
      const back=pad.querySelector('[data-nmb-key="⌫"]');
      for(let i=0;i<18&&back;i++)back.click();
      for(const key of text){
        const button=[...pad.querySelectorAll('[data-nmb-key]')].find(el=>el.dataset.nmbKey===key);
        if(button)button.click();
      }
      pad.querySelector('[data-nmb-done]')?.click();
      await wait(24);return;
    }
    const input=document.getElementById('ba-value');if(!input)return;
    input.value=text;input.dispatchEvent(new Event('change',{bubbles:true}));await wait(24);
  }finally{applying=false}
}

async function applyHidden(id,checked){
  if(applying)return;applying=true;
  try{
    const sid=String(id);if(!await focusTarget(sid))return;
    const hidden=await waitFor(()=>document.getElementById('ba-hidden'));if(!hidden)return;
    hidden.checked=!!checked;hidden.dispatchEvent(new Event('change',{bubbles:true}));await wait(24);
  }finally{applying=false}
}

/* Capture the exact token the async challenge builder is operating on before
 * any adapter redraw can move focus elsewhere. */
document.addEventListener('click',event=>{
  const tile=event.target?.closest?.('[data-ba-token]');
  if(building()&&tile)builderTargetId=String(tile.dataset.baToken||'');
},true);

/* A redraw replaces the v4 Challenge button. If it is clicked before v6 has
 * rebound that fresh node, hold the click and replay it after the rebind. */
document.addEventListener('click',event=>{
  const trigger=event.target?.closest?.('[data-nmb-challenge-toggle]');
  if(!trigger||trigger.dataset.nmbV6Bound)return;
  event.preventDefault();event.stopPropagation();
  setTimeout(()=>replayChallengeClick(),16);
},true);

/* During challenge construction, do not allow a stale base selection to receive
 * a value or hidden-state change. Re-apply that edit to the token that v6
 * actually selected. Outside construction this bridge is completely inert. */
document.addEventListener('change',event=>{
  if(!building()||applying||!builderTargetId)return;
  const input=event.target;if(!input)return;
  if(input.id==='ba-value'){
    const id=builderTargetId,value=input.value;
    event.preventDefault();event.stopImmediatePropagation();
    queueMicrotask(()=>applyValue(id,value));
  }else if(input.id==='ba-hidden'){
    const id=builderTargetId,checked=input.checked;
    event.preventDefault();event.stopImmediatePropagation();
    queueMicrotask(()=>applyHidden(id,checked));
  }
},true);
})();

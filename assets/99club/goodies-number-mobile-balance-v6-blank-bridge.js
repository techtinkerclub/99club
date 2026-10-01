/* Number Mobile v6 state bridge.
 * Keeps generated blank boxes in sync with the v3 Number Mobile editor and
 * protects the v6 Challenge trigger during the brief redraw/rebind window.
 */
(function(){
'use strict';

function replayChallengeClick(attempt=0){
  const fresh=document.querySelector('#gd-stage .gd-number-mobile-workbench [data-nmb-challenge-toggle]');
  if(fresh?.dataset.nmbV6Bound){fresh.click();return}
  if(attempt<8)setTimeout(()=>replayChallengeClick(attempt+1),16);
}

/* v6 needs to know when the base balance editor has really selected a token.
 * The base engine expresses that state with .is-selected, so mirror that true
 * state into the lightweight data marker used by the async challenge builder. */
function mirrorSelectedToken(){
  const work=document.querySelector('#gd-stage .gd-number-mobile-workbench');if(!work)return;
  work.querySelectorAll('[data-ba-selected]').forEach(el=>el.removeAttribute('data-ba-selected'));
  const selected=work.querySelector('[data-ba-token].is-selected');
  if(selected)selected.dataset.baSelected=String(selected.dataset.baToken||'');
}
document.addEventListener('click',()=>{queueMicrotask(mirrorSelectedToken);setTimeout(mirrorSelectedToken,0)},true);
document.addEventListener('change',()=>queueMicrotask(mirrorSelectedToken),true);

/* A redraw replaces the v4 Challenge button. If it is clicked before v6 has
 * rebound that fresh node, hold the click and replay it against the current
 * button after v6's scheduled adapt has attached the difficulty-aware handler. */
document.addEventListener('click',event=>{
  const trigger=event.target?.closest?.('[data-nmb-challenge-toggle]');
  if(!trigger||trigger.dataset.nmbV6Bound)return;
  event.preventDefault();event.stopPropagation();
  setTimeout(()=>replayChallengeClick(),16);
},true);

/* Branch-created boxes are deliberately born as Number Mobile blanks. When the
 * v6 challenge builder assigns one a value through the base balance editor,
 * route that assignment through the Number Mobile keypad itself so its own
 * blank state and the underlying numeric value cannot drift apart. */
document.addEventListener('change',event=>{
  const input=event.target;if(!input||input.id!=='ba-value')return;
  const work=document.querySelector('#gd-stage .gd-number-mobile-workbench');if(!work)return;
  const pad=work.querySelector('.nmb-keypad');if(!pad)return;
  const heading=String(pad.querySelector('.nmb-keypad-head strong')?.textContent||'').trim();if(heading!=='Empty box')return;
  const text=String(input.value??'').trim();if(!/^\d+(?:\.\d+)?$/.test(text))return;
  event.preventDefault();event.stopImmediatePropagation();
  for(const key of text){
    const button=[...pad.querySelectorAll('[data-nmb-key]')].find(el=>el.dataset.nmbKey===key);
    if(button)button.click();
  }
  pad.querySelector('[data-nmb-done]')?.click();
},true);
})();

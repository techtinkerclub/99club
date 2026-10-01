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

/* A redraw replaces the v4 Challenge button. If it is clicked before v6 has
 * rebound that fresh node, hold the click and replay it after the rebind. */
document.addEventListener('click',event=>{
  const trigger=event.target?.closest?.('[data-nmb-challenge-toggle]');
  if(!trigger||trigger.dataset.nmbV6Bound)return;
  event.preventDefault();event.stopPropagation();
  setTimeout(()=>replayChallengeClick(),16);
},true);

/* Branch-created Number Mobile boxes start with v3's own blank flag. The base
 * challenge builder edits values through #ba-value. When that selected box is
 * still a Number Mobile blank, mirror the value through the matching keypad in
 * the same event turn. This clears v3's blank state synchronously, while the
 * builder remains free to continue using its normal synchronous balance edit.
 * Matching by data-ba-selected/data-nmb-keypad prevents edits spilling into a
 * previously focused box. */
document.addEventListener('change',event=>{
  const input=event.target;if(!input||input.id!=='ba-value')return;
  const work=document.querySelector('#gd-stage .gd-number-mobile-workbench');if(!work)return;
  const selected=work.querySelector('.gd-eq-selected[data-ba-selected]');if(!selected)return;
  const id=String(selected.dataset.baSelected||'');if(!id)return;
  const tile=work.querySelector('[data-ba-token="'+CSS.escape(id)+'"]');
  if(!tile?.classList.contains('is-blank-box'))return;
  const pad=work.querySelector('.nmb-keypad[data-nmb-keypad="'+CSS.escape(id)+'"]');if(!pad)return;
  const text=String(input.value??'').trim();if(!/^\d+(?:\.\d+)?$/.test(text))return;

  /* Do not cancel the builder's original value edit. The keypad pass is only
     responsible for clearing/updating v3's presentation state. v3 queues its
     engine writes until after this event turn, so these synchronous key clicks
     can safely share the current keypad node. */
  pad.querySelector('[data-nmb-blank]')?.click();
  for(const key of text){
    const button=[...pad.querySelectorAll('[data-nmb-key]')].find(el=>el.dataset.nmbKey===key);
    if(button)button.click();
  }
  pad.querySelector('[data-nmb-done]')?.click();
},true);
})();

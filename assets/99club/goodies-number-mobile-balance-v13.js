/* Number Mobile Balance v13 · compact numeric answer interaction
 * Numeric challenges show one answer box. Tapping it opens the number keypad
 * in a popover, so the answer strip stays compact. Existing v8 numeric input
 * logic is reused where available; this layer also repairs the older generic
 * classification of the numeric "Make it balance" prompt.
 */
(function(G){
'use strict';
if(!G)return;
let runToken=0,activePanel=null;
function q(sel,root=document){return root?.querySelector?.(sel)||null}
function qa(sel,root=document){return root?.querySelectorAll?[...root.querySelectorAll(sel)]:[]}
function stage(){return document.getElementById('gd-stage')}
function work(){return q('.gd-number-mobile-workbench',stage())}
function banner(){return q('.gd-challenge-banner',stage())}
function text(el){return String(el?.textContent||'').trim()}
function numeric(value){const n=Number(String(value??'').trim());return Number.isFinite(n)?n:null}
function sideTotal(side){return qa('.gd-eq-side--'+side+' .gd-eq-weights [data-ba-token]',work()).reduce((sum,tile)=>{const n=numeric(text(q('strong',tile)));return sum+(n==null?0:n)},0)}
function revealButton(){return q('[data-board-action="reveal"]',banner())}
function closePad(panel=activePanel){
  if(!panel)return;
  const pad=q('.nmb-v13-number-pad',panel),display=q('[data-nmb-v13-answer-box]',panel);
  if(pad)pad.hidden=true;
  if(display)display.setAttribute('aria-expanded','false');
  panel.classList.remove('nmb-v13-pad-open');
  if(activePanel===panel)activePanel=null;
}
function openPad(panel){
  if(activePanel&&activePanel!==panel)closePad(activePanel);
  const pad=q('.nmb-v13-number-pad',panel),display=q('[data-nmb-v13-answer-box]',panel);
  if(!pad||!display)return;
  activePanel=panel;pad.hidden=false;panel.classList.add('nmb-v13-pad-open');display.setAttribute('aria-expanded','true');
}
function looksLikeNumericBalance(panel){
  if(panel?.dataset?.nmbV8Response!=='generic')return false;
  const prompt=text(q('.gd-challenge-prompt',banner())).toLowerCase();
  return /how much.*(?:add|added).*lighter.*balance|how much.*balance.*main bar/.test(prompt);
}
function repairNumericBalance(panel){
  if(!looksLikeNumericBalance(panel)||panel.dataset.nmbV13BalanceRepair==='1')return false;
  panel.dataset.nmbV13BalanceRepair='1';panel.dataset.nmbV8Response='balance';
  panel.innerHTML='<span class="nmb-v8-response-label">How much must be added to the lighter main side to balance the main bar?</span><div class="nmb-v8-number-response"><div class="nmb-v8-response-display" tabindex="0">?</div><div class="nmb-v8-response-keys">'+['1','2','3','4','5','6','7','8','9','0','⌫'].map(k=>'<button type="button" data-nmb-v8-response-key="'+k+'">'+k+'</button>').join('')+'</div><button type="button" class="nmb-v8-check" data-nmb-v8-response-check>Check answer</button></div><span class="nmb-v8-feedback" data-nmb-v8-feedback aria-live="polite"></span>';
  let buffer='';const display=q('.nmb-v8-response-display',panel),feedback=q('[data-nmb-v8-feedback]',panel),keys=qa('[data-nmb-v8-response-key]',panel),check=q('[data-nmb-v8-response-check]',panel);
  function clearFeedback(){feedback.textContent='';feedback.className='nmb-v8-feedback';const reveal=revealButton();if(reveal)reveal.hidden=false}
  keys.forEach(button=>button.onclick=()=>{const key=button.dataset.nmbV8ResponseKey;if(key==='⌫')buffer=buffer.slice(0,-1);else buffer=(buffer+key).replace(/^0(?=\d)/,'');display.textContent=buffer||'?';clearFeedback()});
  check.onclick=()=>{const given=numeric(buffer),expected=Math.abs(sideTotal('left')-sideTotal('right')),ok=given!=null&&Math.abs(given-expected)<1e-9;feedback.textContent=ok?'Correct ✓':'Not quite — try again.';feedback.className='nmb-v8-feedback '+(ok?'is-correct':'is-wrong');const reveal=revealButton();if(reveal)reveal.hidden=ok};
  return true;
}
function enhancePanel(panel){
  if(!panel)return false;
  repairNumericBalance(panel);
  if(panel.dataset.nmbV13Numeric==='1')return true;
  const number=q('.nmb-v8-number-response',panel),display=q('.nmb-v8-response-display',number),keys=q('.nmb-v8-response-keys',number),check=q('[data-nmb-v8-response-check]',number);
  if(!number||!display||!keys||!check)return false;
  panel.dataset.nmbV13Numeric='1';number.classList.add('nmb-v13-number-response');
  display.dataset.nmbV13AnswerBox='1';display.setAttribute('role','button');display.setAttribute('aria-haspopup','dialog');display.setAttribute('aria-expanded','false');display.setAttribute('aria-label','Numeric answer. Tap to open number keypad');display.title='Tap to enter your answer';
  const pad=document.createElement('div');pad.className='nmb-v13-number-pad';pad.hidden=true;pad.setAttribute('role','dialog');pad.setAttribute('aria-label','Number keypad');
  const head=document.createElement('div');head.className='nmb-v13-number-pad__head';head.innerHTML='<strong>Enter your answer</strong><button type="button" data-nmb-v13-close aria-label="Close number keypad">×</button>';
  const body=document.createElement('div');body.className='nmb-v13-number-pad__body';body.appendChild(keys);body.appendChild(check);pad.appendChild(head);pad.appendChild(body);number.appendChild(pad);
  const toggle=e=>{e.preventDefault();e.stopPropagation();pad.hidden?openPad(panel):closePad(panel)};
  display.addEventListener('click',toggle);
  display.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){toggle(e)}else if(e.key==='Escape'){closePad(panel)}});
  q('[data-nmb-v13-close]',pad).addEventListener('click',e=>{e.preventDefault();e.stopPropagation();closePad(panel);display.focus()});
  check.addEventListener('click',()=>setTimeout(()=>{if(q('.nmb-v8-feedback.is-correct',panel))closePad(panel)},0));
  qa('[data-nmb-v8-response-key]',keys).forEach(button=>button.addEventListener('click',()=>display.focus({preventScroll:true})));
  return true;
}
function enhanceCurrent(){
  const panel=q('.nmb-v8-response-panel',stage());
  if(!panel){if(activePanel)closePad(activePanel);return false}
  return enhancePanel(panel);
}
async function stabilise(){
  const token=++runToken;
  for(let i=0;i<160&&token===runToken;i++){
    if(enhanceCurrent())return;
    await new Promise(r=>setTimeout(r,40));
  }
}
function relevant(target){return !!target?.closest?.('.nmb-v5-challenge-popover,[data-nmb-v6-type],[data-nmb-v6-another],[data-nmb-v9-change],[data-nmb-challenge-toggle],[data-board-action="reveal"],[data-nmb-v7-exit]')}
function install(){
  window.addEventListener('click',e=>{if(relevant(e.target))setTimeout(stabilise,0)},true);
  document.addEventListener('click',e=>{if(relevant(e.target))setTimeout(stabilise,0)},false);
  document.addEventListener('click',e=>{if(activePanel&&!e.target.closest('.nmb-v13-number-response'))closePad(activePanel)},false);
  setTimeout(stabilise,100);
}
G.numberMobileNumericInputVersion='13.1';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})(window.TT99Goodies);

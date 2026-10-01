/* Number Mobile Balance v10 · event-driven pupil challenge state */
(function(G){
'use strict';
if(!G)return;
let regenerating=false;

function q(sel,root=document){return root?.querySelector?.(sel)||null}
function qa(sel,root=document){return root?.querySelectorAll?[...root.querySelectorAll(sel)]:[]}
function stage(){return document.getElementById('gd-stage')}
function work(){return q('.gd-number-mobile-workbench',stage())}
function banner(){return q('.gd-challenge-banner',stage())}
function spec(){return G.numberMobileChallengeSpec||null}
function wait(ms=30){return new Promise(resolve=>setTimeout(resolve,ms))}
async function waitFor(fn,{tries=70,delay=30}={}){for(let i=0;i<tries;i++){const value=fn();if(value)return value;await wait(delay)}return null}
function expectedEntries(){const map=spec()?.answerByToken;if(!map||typeof map!=='object')return[];return Object.entries(map).map(([id,value])=>[String(id),Number(value)]).filter(([,value])=>Number.isFinite(value))}
function tileFor(id){return q('[data-ba-token="'+CSS.escape(String(id))+'"]',work())}
function tileNumber(tile){const raw=String(q('strong',tile)?.textContent||'').trim();if(!raw||raw==='?')return null;const value=Number(raw);return Number.isFinite(value)?value:null}
function feedback(){return q('[data-nmb-v8-feedback]',stage())}
function revealButton(){return q('.gd-challenge-actions [data-board-action="reveal"]',banner())}
function showReveal(){const reveal=revealButton();if(!reveal)return;reveal.hidden=false;reveal.disabled=false;reveal.removeAttribute('aria-hidden');reveal.style.removeProperty('display')}
function hideReveal(){const reveal=revealButton();if(!reveal)return;reveal.hidden=true;reveal.disabled=true;reveal.setAttribute('aria-hidden','true');reveal.style.setProperty('display','none','important')}
function setFeedback(message,kind=''){const el=feedback();if(!el)return;el.textContent=message||'';el.className='nmb-v8-feedback'+(kind?' is-'+kind:'');el.setAttribute('aria-live','polite')}
function clearAssessment(){expectedEntries().forEach(([id])=>tileFor(id)?.classList.remove('nmb-v8-answer-correct','nmb-v8-answer-wrong'));setFeedback('','');showReveal()}
function multiMissing(){return expectedEntries().length>1}
function checkAllMissing(){
  const entries=expectedEntries();if(entries.length<2)return false;
  const rows=entries.map(([id,expected])=>({tile:tileFor(id),expected}));
  if(rows.some(row=>!row.tile))return false;
  const values=rows.map(row=>tileNumber(row.tile));
  if(values.some(value=>value===null)){
    rows.forEach(row=>row.tile.classList.remove('nmb-v8-answer-correct','nmb-v8-answer-wrong'));
    setFeedback('Fill in all ? boxes, then check.','');showReveal();return true;
  }
  let allCorrect=true;
  rows.forEach((row,index)=>{const ok=Math.abs(values[index]-row.expected)<1e-9;allCorrect=allCorrect&&ok;row.tile.classList.toggle('nmb-v8-answer-correct',ok);row.tile.classList.toggle('nmb-v8-answer-wrong',!ok)});
  if(allCorrect){setFeedback('Correct ✓','correct');q('.nmb-v8-answer-pad',stage())?.remove();hideReveal()}
  else{setFeedback('Not quite — check both answers.','wrong');showReveal()}
  return true;
}
async function anotherClean(type,difficulty){
  if(regenerating)return;regenerating=true;
  try{
    let trigger=await waitFor(()=>q('[data-nmb-challenge-toggle]',work()));if(!trigger)return;
    trigger.click();
    let pop=await waitFor(()=>q('.nmb-v5-challenge-popover',work()));if(!pop)return;
    const clear=q('[data-nmb-v6-clear]',pop);if(clear){
      clear.click();
      await waitFor(()=>!banner());
      await waitFor(()=>!document.body.classList.contains('nmb-v8-pupil-challenge'));
    }
    trigger=await waitFor(()=>q('[data-nmb-challenge-toggle]',work()));if(!trigger)return;
    await wait(40);trigger.click();
    pop=await waitFor(()=>q('.nmb-v5-challenge-popover',work()));if(!pop)return;
    let diff=q('[data-nmb-v6-difficulty="'+CSS.escape(String(difficulty||'easy'))+'"]',pop);
    if(diff&&!diff.classList.contains('is-active')){
      diff.click();
      pop=await waitFor(()=>q('.nmb-v5-challenge-popover [data-nmb-v6-difficulty="'+CSS.escape(String(difficulty||'easy'))+'"].is-active')?.closest('.nmb-v5-challenge-popover'));
      if(!pop)return;
    }
    const next=q('[data-nmb-v6-type="'+CSS.escape(String(type))+'"]',pop);if(next)next.click();
  }finally{regenerating=false}
}
function captureWindowClick(e){
  const another=e.target?.closest?.('[data-nmb-v6-another]');
  if(!another)return;
  const s=spec();if(!s?.type)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  anotherClean(s.type,s.difficulty||G.numberMobileChallengeDifficulty||'easy');
}
function captureCheck(e){
  const check=e.target?.closest?.('[data-nmb-v8-check]');
  if(check&&multiMissing()){
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();checkAllMissing();
  }
}
function bubbleClick(e){
  if(e.target?.closest?.('[data-nmb-v8-key]'))setTimeout(clearAssessment,0);
}
function captureKeydown(e){
  if(e.key!=='Enter'||!multiMissing()||!q('.nmb-v8-answer-pad',stage()))return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();checkAllMissing();
}
function install(){
  window.addEventListener('click',captureWindowClick,true);
  document.addEventListener('click',captureCheck,true);
  document.addEventListener('click',bubbleClick,false);
  window.addEventListener('keydown',captureKeydown,true);
}
G.numberMobilePupilStateVersion='10.2';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})(window.TT99Goodies);

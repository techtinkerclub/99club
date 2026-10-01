/* Number Mobile Balance v9 · challenge chrome and state helper */
(function(){
'use strict';
let observer=null,currentKey='',multiCheckRequested=false,regenerating=false;
function q(sel,root=document){return root&&root.querySelector?root.querySelector(sel):null}
function qa(sel,root=document){return root&&root.querySelectorAll?[...root.querySelectorAll(sel)]:[]}
function stage(){return document.getElementById('gd-stage')}
function banner(){return q('.gd-challenge-banner',stage())}
function work(){return q('.gd-number-mobile-workbench',stage())}
function goodies(){return window.TT99Goodies||{}}
function spec(){return goodies().numberMobileChallengeSpec||null}
function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
async function waitFor(fn,tries=40,delay=30){for(let i=0;i<tries;i++){const value=fn();if(value)return value;await wait(delay)}return null}
function feedback(){return q('[data-nmb-v8-feedback]',stage())}
function revealButton(){return q('.gd-challenge-actions [data-board-action="reveal"]',banner())}
function expectedEntries(){const map=spec()&&spec().answerByToken;if(!map||typeof map!=='object')return[];return Object.entries(map).map(([id,value])=>[String(id),Number(value)]).filter(([,value])=>Number.isFinite(value))}
function challengeKey(){const s=spec(),entries=expectedEntries().sort((a,b)=>a[0].localeCompare(b[0]));return [s&&s.type||'',s&&s.difficulty||'',q('.gd-challenge-prompt',banner())?.textContent||'',JSON.stringify(entries)].join('|')}
function tileFor(id){return q('[data-ba-token="'+CSS.escape(String(id))+'"]',work())}
function tileValue(tile){const raw=String(q('strong',tile)?.textContent||'').trim();if(!raw||raw==='?')return null;const value=Number(raw);return Number.isFinite(value)?value:null}
function setFeedback(message,kind){const el=feedback();if(!el)return;el.textContent=message||'';el.className='nmb-v8-feedback'+(kind?' is-'+kind:'');el.setAttribute('aria-live','polite')}
function syncReveal(){const reveal=revealButton();if(!reveal)return;const fb=feedback(),solved=!!(fb&&fb.classList.contains('is-correct'));reveal.hidden=solved;reveal.disabled=solved;reveal.setAttribute('aria-hidden',solved?'true':'false')}
function scrubAnswerDom(){
  expectedEntries().forEach(([id])=>{const tile=tileFor(id),strong=q('strong',tile);if(strong)strong.textContent='?';if(tile)tile.classList.remove('nmb-v8-answer-correct','nmb-v8-answer-wrong')});
  q('.nmb-v8-answer-pad',stage())?.remove();setFeedback('','');multiCheckRequested=false;syncReveal();
}
function syncMultiAnswers(){
  const entries=expectedEntries();if(entries.length<2){syncReveal();return}
  const rows=entries.map(([id,expected])=>({tile:tileFor(id),expected})).filter(row=>row.tile);if(rows.length!==entries.length){syncReveal();return}
  const values=rows.map(row=>tileValue(row.tile)),allFilled=values.every(value=>value!==null);
  if(!allFilled){
    rows.forEach(row=>row.tile.classList.remove('nmb-v8-answer-correct','nmb-v8-answer-wrong'));
    const fb=feedback();if(fb&&(fb.classList.contains('is-correct')||fb.classList.contains('is-wrong')))setFeedback('Fill in all ? boxes, then check.','');
    multiCheckRequested=false;syncReveal();return;
  }
  if(!multiCheckRequested){
    rows.forEach(row=>row.tile.classList.remove('nmb-v8-answer-correct','nmb-v8-answer-wrong'));
    const fb=feedback();if(fb&&(fb.classList.contains('is-correct')||fb.classList.contains('is-wrong')))setFeedback('','');
    syncReveal();return;
  }
  let allCorrect=true;
  rows.forEach((row,index)=>{const ok=Math.abs(values[index]-row.expected)<1e-9;allCorrect=allCorrect&&ok;row.tile.classList.toggle('nmb-v8-answer-correct',ok);row.tile.classList.toggle('nmb-v8-answer-wrong',!ok)});
  setFeedback(allCorrect?'Correct ✓':'Not quite — check both answers.',allCorrect?'correct':'wrong');
  if(allCorrect)q('.nmb-v8-answer-pad',stage())?.remove();syncReveal();
}
function syncChrome(){
  const active=document.body.classList.contains('nmb-v8-pupil-challenge'),b=banner(),w=work();if(!active||!b||!w)return;
  const key=challengeKey();if(key!==currentKey){currentKey=key;multiCheckRequested=false}
  const actions=q('.gd-challenge-actions',b);if(actions){
    let change=q('[data-nmb-v9-change]',actions);if(!change){change=document.createElement('button');change.type='button';change.className='gd-challenge-action';change.dataset.nmbV9Change='1';change.textContent='Change';change.title='Choose a different Number Mobile challenge';change.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();q('[data-nmb-challenge-toggle]',w)?.click()});actions.insertBefore(change,actions.firstChild)}
    const another=q('[data-nmb-v6-another]',actions);if(another){another.textContent='Another';another.title='Generate another challenge of this type'}
    const reveal=q('[data-board-action="reveal"]',actions);if(reveal){reveal.textContent='Reveal';reveal.title='Reveal the answer'}
    const exit=q('[data-nmb-v7-exit]',actions);if(exit){exit.textContent='Exit';exit.title='Exit challenge mode'}
  }
  syncMultiAnswers();syncReveal();
}
async function cleanAnother(type,difficulty){
  if(regenerating)return;regenerating=true;
  try{
    scrubAnswerDom();
    let w=work(),trigger=q('[data-nmb-challenge-toggle]',w);if(!trigger)return;trigger.click();
    let pop=await waitFor(()=>q('.nmb-v5-challenge-popover',work()));const clear=q('[data-nmb-v6-clear]',pop);if(clear){clear.click();await waitFor(()=>!banner());await wait(120)}
    w=work();trigger=q('[data-nmb-challenge-toggle]',w);if(!trigger)return;trigger.click();pop=await waitFor(()=>q('.nmb-v5-challenge-popover',work()));if(!pop)return;
    const diff=q('[data-nmb-v6-difficulty="'+CSS.escape(String(difficulty||'easy'))+'"]',pop);if(diff){diff.click();pop=await waitFor(()=>q('.nmb-v5-challenge-popover',work()))}
    const next=q('[data-nmb-v6-type="'+CSS.escape(String(type))+'"]',pop);if(next)next.click();
  }finally{regenerating=false}
}
function captureGeneration(e){
  const another=e.target?.closest?.('[data-nmb-v6-another]');if(another){const s=spec();if(s&&s.type){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();cleanAnother(s.type,s.difficulty||goodies().numberMobileChallengeDifficulty||'easy');return}}
  if(e.target?.closest?.('[data-nmb-v6-type]'))scrubAnswerDom();
}
function bubbleAnswer(e){
  if(e.target?.closest?.('[data-nmb-v8-key]')){multiCheckRequested=false;setTimeout(syncMultiAnswers,0);return}
  if(e.target?.closest?.('[data-nmb-v8-check]')){multiCheckRequested=true;setTimeout(syncMultiAnswers,0);return}
  setTimeout(syncChrome,0);
}
function install(){
  const root=document.getElementById('tt99-goodies-root');if(root){observer=new MutationObserver(()=>queueMicrotask(syncChrome));observer.observe(root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','hidden']})}
  document.addEventListener('click',captureGeneration,true);document.addEventListener('click',bubbleAnswer,false);syncChrome();
}
window.TT99NumberMobileChallengeChromeVersion='9.1';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

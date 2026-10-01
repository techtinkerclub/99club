/* 99 Club Studio · Number Mobile Balance v4 enhancement
 * Small classroom-UX layer over v3: temporary context actions, editable starter
 * boxes and a compact launcher for the shared Balance challenge engine.
 */
(function(G){
'use strict';
if(!G)return;
const STAGE_ID='gd-stage',balanceToolV3=G.balanceTool;
let stageObserver=null,controlsObserver=null,challengeOpen=false,installed=false;
const TYPE_CATEGORY={
  'missing-weight':'read','choose-relation':'read','find-difference':'read',
  'make-balance':'build','same-to-both':'build','spot-false-equality':'reason'
};
const CHALLENGES=[
  ['random','Surprise me'],
  ['missing-weight','Missing number'],
  ['make-balance','Make it balance'],
  ['choose-relation','Compare'],
  ['find-difference','Difference'],
  ['same-to-both','Same to both'],
  ['spot-false-equality','Spot the mistake']
];
function stage(){return document.getElementById(STAGE_ID)}
function work(){return stage()?.querySelector('.gd-number-mobile-workbench')||null}
function controls(){return document.getElementById('gd-controls')}
function isChallenge(){return !!stage()?.querySelector('.gd-challenge-banner')}
function dismissContext(){
  const w=work();if(!w)return;
  w.classList.add('nmb-context-dismissed');challengeOpen=false;
  const close=w.querySelector('[data-nmb-close]');if(close)close.click();
  w.querySelectorAll('.nmb-keypad,.nmb-tile-toolbar,.nmb-branch-toolbar,.nmb-challenge-popover').forEach(el=>el.remove());
  const trigger=w.querySelector('[data-nmb-challenge-toggle]');if(trigger)trigger.setAttribute('aria-expanded','false');
}
function revealContext(){const w=work();if(w)w.classList.remove('nmb-context-dismissed')}
function unlockStarterBoxes(w){
  if(!w||isChallenge())return;
  w.querySelectorAll('[data-ba-token]').forEach(tile=>{
    tile.disabled=false;tile.removeAttribute('disabled');tile.classList.remove('is-frozen');
  });
}
function selectWorkflowChallenge(){
  const c=controls();if(!c)return false;
  const workflow=c.querySelector('[data-ba-workflow="challenge"]');if(workflow)workflow.click();
  return true;
}
function generateChallenge(type){
  if(type==='random'){
    const pool=['missing-weight','make-balance','choose-relation','find-difference','same-to-both','spot-false-equality'];
    type=pool[Math.floor(Math.random()*pool.length)];
  }
  if(!selectWorkflowChallenge())return false;
  let c=controls(),category=TYPE_CATEGORY[type]||'read';
  const cat=c?.querySelector('[data-ba-challenge-cat="'+category+'"]');if(cat)cat.click();
  c=controls();
  const typeButton=c?.querySelector('[data-ba-challenge-type="'+type+'"]');if(typeButton)typeButton.click();
  c=controls();const generate=c?.querySelector('#ba-generate');if(generate){generate.click();challengeOpen=false;setTimeout(adaptStage,0);return true}
  return false;
}
function clearChallenge(){
  if(!selectWorkflowChallenge())return;
  const clear=controls()?.querySelector('#ba-clear-challenge');if(clear){clear.click();challengeOpen=false;setTimeout(adaptStage,0)}
}
function challengePopover(){
  const pop=document.createElement('div');pop.className='nmb-challenge-popover';pop.setAttribute('role','menu');pop.setAttribute('aria-label','Number Mobile challenges');
  const heading=document.createElement('strong');heading.textContent='Generate challenge';pop.appendChild(heading);
  CHALLENGES.forEach(([id,label])=>{const b=document.createElement('button');b.type='button';b.dataset.nmbChallenge=id;b.textContent=label;b.onclick=e=>{e.stopPropagation();generateChallenge(id)};pop.appendChild(b)});
  if(isChallenge()){
    const clear=document.createElement('button');clear.type='button';clear.className='is-danger';clear.textContent='Clear challenge';clear.onclick=e=>{e.stopPropagation();clearChallenge()};pop.appendChild(clear);
  }
  return pop;
}
function ensureChallengeLauncher(w){
  if(!w||w.querySelector('[data-nmb-challenge-toggle]'))return;
  const summary=w.querySelector('.gd-eq-summary');if(!summary)return;
  const wrap=document.createElement('div');wrap.className='nmb-challenge-launcher';
  const trigger=document.createElement('button');trigger.type='button';trigger.className='nmb-challenge-trigger';trigger.dataset.nmbChallengeToggle='1';trigger.textContent='Challenge';trigger.setAttribute('aria-expanded','false');
  trigger.onclick=e=>{
    e.stopPropagation();revealContext();challengeOpen=!challengeOpen;
    w.querySelector('.nmb-challenge-popover')?.remove();
    trigger.setAttribute('aria-expanded',challengeOpen?'true':'false');
    if(challengeOpen)wrap.appendChild(challengePopover());
  };
  wrap.appendChild(trigger);summary.appendChild(wrap);
}
function adaptStage(){
  const w=work();if(!w)return;
  unlockStarterBoxes(w);ensureChallengeLauncher(w);
  if(w.classList.contains('nmb-context-dismissed')){
    w.querySelectorAll('.nmb-keypad,.nmb-tile-toolbar,.nmb-branch-toolbar').forEach(el=>el.remove());
  }
}
function insideInteractive(target){return !!target.closest?.('[data-ba-token],.nmb-keypad,.nmb-tile-toolbar,.nmb-branch-bar,.nmb-branch-toolbar,.nmb-branch-add,.nmb-branch-empty,.nmb-challenge-launcher,[data-ba-stage-add]')}
function pointerCapture(e){
  const w=work();if(!w)return;
  if(insideInteractive(e.target)){
    revealContext();
    setTimeout(adaptStage,0);
    return;
  }
  if(w.contains(e.target)||stage()?.contains(e.target))dismissContext();
}
function installObservers(){
  if(stageObserver)stageObserver.disconnect();if(controlsObserver)controlsObserver.disconnect();
  const s=stage(),c=controls();
  if(s){let queued=false;stageObserver=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;adaptStage()})});stageObserver.observe(s,{childList:true})}
  if(c){controlsObserver=new MutationObserver(()=>{queueMicrotask(adaptStage)});controlsObserver.observe(c,{childList:true})}
  adaptStage();
}
function install(){
  if(installed)return;installed=true;
  document.addEventListener('pointerdown',pointerCapture,true);
  window.addEventListener('blur',dismissContext);
  installObservers();
  const root=document.getElementById('tt99-goodies-root');if(root){const obs=new MutationObserver(()=>{if(document.getElementById(STAGE_ID))installObservers()});obs.observe(root,{childList:true,subtree:false})}
}
if(typeof balanceToolV3==='function'){
  G.balanceTool=function numberMobileBalanceToolV4(){
    const result=balanceToolV3.apply(this,arguments);
    setTimeout(installObservers,0);
    return result;
  };
}
G.numberMobileBalanceEnhancementVersion='4.0';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else queueMicrotask(install);
})(window.TT99Goodies);

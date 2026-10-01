/* 99 Club Studio · Number Mobile Balance v7
 * Challenge UX guard: construct puzzles behind a curtain so hidden answers are
 * never briefly visible, and expose a direct Exit challenge action.
 */
(function(G){
'use strict';
if(!G)return;

const BUILD_CLASS='nmb-v7-challenge-building';
let installed=false,building=false,buildSeq=0,buildStarted=0,settleTimer=null,failSafeTimer=null,observer=null,exiting=false;

function q(sel,root=document){return root?.querySelector?.(sel)||null}
function stage(){return document.getElementById('gd-stage')}
function controls(){return document.getElementById('gd-controls')}
function work(){return q('.gd-number-mobile-workbench',stage())}
function banner(){return q('.gd-challenge-banner',stage())}
function wait(ms=30){return new Promise(resolve=>setTimeout(resolve,ms))}
async function waitFor(fn,{tries=50,delay=30}={}){for(let i=0;i<tries;i++){const value=fn();if(value)return value;await wait(delay)}return null}

function setBuilding(on){
  building=!!on;
  document.documentElement.classList.toggle(BUILD_CLASS,building);
  document.body.classList.toggle(BUILD_CLASS,building);
  if(building)document.body.setAttribute('aria-busy','true');else document.body.removeAttribute('aria-busy');
}
function finishBuild(seq){
  if(seq!==buildSeq)return;
  clearTimeout(settleTimer);clearTimeout(failSafeTimer);settleTimer=failSafeTimer=null;
  setBuilding(false);ensureExit();
}
function armSettle(seq){
  if(!building||seq!==buildSeq)return;
  clearTimeout(settleTimer);
  settleTimer=setTimeout(()=>{
    if(!building||seq!==buildSeq)return;
    const oldEnough=Date.now()-buildStarted>=430;
    const ready=!!banner()&&!!work()&&!q('.nmb-v5-challenge-popover',work());
    if(!oldEnough||!ready){armSettle(seq);return}
    requestAnimationFrame(()=>requestAnimationFrame(()=>finishBuild(seq)));
  },180);
}
function beginBuild(){
  const seq=++buildSeq;buildStarted=Date.now();setBuilding(true);armSettle(seq);
  clearTimeout(failSafeTimer);failSafeTimer=setTimeout(()=>finishBuild(seq),5000);
}
function noteMutation(){
  if(building)armSettle(buildSeq);
  if(!building)ensureExit();
}

async function exitChallenge(){
  if(exiting)return;exiting=true;
  try{
    if(building)finishBuild(buildSeq);
    const challengeTab=q('[data-ba-workflow="challenge"]',controls());if(challengeTab)challengeTab.click();
    let clear=await waitFor(()=>q('#ba-clear-challenge',controls()),{tries:30,delay:25});
    if(clear){clear.click();await waitFor(()=>!banner(),{tries:36,delay:25})}
    if(banner()){
      const trigger=q('[data-nmb-challenge-toggle]',work());if(trigger)trigger.click();
      const popClear=await waitFor(()=>q('[data-nmb-v6-clear]',work()),{tries:20,delay:25});if(popClear)popClear.click();
      await waitFor(()=>!banner(),{tries:36,delay:25});
    }
  }finally{exiting=false;ensureExit()}
}
function ensureExit(){
  const b=banner();if(!b)return;
  const actions=q('.gd-challenge-actions',b);if(!actions||q('[data-nmb-v7-exit]',actions))return;
  const button=document.createElement('button');button.type='button';button.className='gd-challenge-action nmb-v7-exit-challenge';button.dataset.nmbV7Exit='1';button.textContent='Exit challenge';button.title='Return to normal Number Mobile mode';button.setAttribute('aria-label','Exit challenge mode');
  button.onclick=e=>{e.preventDefault();e.stopPropagation();exitChallenge()};
  actions.appendChild(button);
}
function installObserver(){
  observer?.disconnect();const root=document.getElementById('tt99-goodies-root');if(!root)return;
  observer=new MutationObserver(noteMutation);observer.observe(root,{childList:true,subtree:true,characterData:true});
}
function captureChallengeStart(e){
  const target=e.target?.closest?.('[data-nmb-v6-type],[data-nmb-v6-another]');if(!target)return;
  beginBuild();
}
function install(){
  if(installed)return;installed=true;
  document.addEventListener('click',captureChallengeStart,true);
  document.addEventListener('click',()=>setTimeout(ensureExit,0),true);
  installObserver();ensureExit();
}

G.numberMobileChallengeUxVersion='7.0';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else queueMicrotask(install);
})(window.TT99Goodies);

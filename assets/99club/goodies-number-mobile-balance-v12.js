/* Number Mobile Balance v12 · first-run challenge chrome stabiliser
 * Keeps the working challenge engine untouched. This layer only normalises
 * the pupil action row after late buttons are inserted by older adapters.
 */
(function(G){
'use strict';
if(!G)return;
let watchedActions=null,actionsObserver=null,runToken=0;
function q(sel,root=document){return root?.querySelector?.(sel)||null}
function stage(){return document.getElementById('gd-stage')}
function work(){return q('.gd-number-mobile-workbench',stage())}
function banner(){return q('.gd-challenge-banner',stage())}
function pupilReady(){return document.body.classList.contains('nmb-v8-pupil-challenge')&&!!banner()}
function setLabel(button,label,title){if(!button)return;if(button.textContent.trim()!==label)button.textContent=label;if(title&&button.title!==title)button.title=title}
function tidy(){
  if(!pupilReady())return false;
  const b=banner(),w=work(),actions=q('.gd-challenge-actions',b);if(!b||!w||!actions)return false;
  let buttons=[...actions.querySelectorAll('button')];
  let change=q('[data-nmb-v9-change]',actions)||buttons.find(btn=>/^change$/i.test(btn.textContent.trim()));
  if(!change){
    change=document.createElement('button');change.type='button';change.className='gd-challenge-action';change.dataset.nmbV9Change='1';change.textContent='Change';change.onclick=e=>{e.preventDefault();e.stopPropagation();q('[data-nmb-challenge-toggle]',w)?.click()};actions.insertBefore(change,actions.firstChild);
  }
  let another=q('[data-nmb-v6-another]',actions)||buttons.find(btn=>/^another(?: like this)?$/i.test(btn.textContent.trim()));
  if(!another&&G.numberMobileChallengeSpec?.type){
    another=document.createElement('button');another.type='button';another.className='gd-challenge-action';another.dataset.nmbV6Another='1';another.textContent='Another';actions.insertBefore(another,q('[data-board-action="reveal"]',actions)||null);
  }
  buttons=[...actions.querySelectorAll('button')];
  setLabel(change,'Change','Choose a different Number Mobile challenge');
  setLabel(another||buttons.find(btn=>/^another(?: like this)?$/i.test(btn.textContent.trim())),'Another','Generate another challenge of this type');
  setLabel(q('[data-board-action="reveal"]',actions),'Reveal','Reveal the answer');
  setLabel(q('[data-nmb-v7-exit]',actions),'Exit','Exit challenge mode');
  if(watchedActions!==actions){
    actionsObserver?.disconnect();watchedActions=actions;
    actionsObserver=new MutationObserver(()=>queueMicrotask(tidy));
    /* Direct children only: catches late-added Another/Exit buttons without
       reacting to our own text-node edits or anything elsewhere on the board. */
    actionsObserver.observe(actions,{childList:true});
  }
  return true;
}
async function stabilise(){
  const token=++runToken;
  /* A Hard custom mobile can take several seconds to assemble in an embedded
     board. Stay bounded, but remain alive for the whole construction window. */
  for(let i=0;i<240&&token===runToken;i++){
    if(tidy()){
      /* Keep a short settling tail for buttons appended after pupil mode first
         becomes visible. The direct action-row observer takes over afterward. */
      for(let j=0;j<40&&token===runToken;j++){await new Promise(r=>setTimeout(r,50));tidy()}
      return;
    }
    await new Promise(r=>setTimeout(r,50));
  }
}
function relevant(target){return !!target?.closest?.('[data-nmb-v6-type],[data-nmb-v6-another],[data-nmb-v9-change],[data-nmb-challenge-toggle],[data-board-action="reveal"],[data-nmb-v7-exit]')}
function install(){
  window.addEventListener('click',e=>{if(relevant(e.target))setTimeout(stabilise,0)},true);
  document.addEventListener('click',e=>{if(relevant(e.target))setTimeout(stabilise,0)},false);
  setTimeout(stabilise,80);
}
G.numberMobileChromeVersion='12.1';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})(window.TT99Goodies);

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
function banner(){return q('.gd-challenge-banner',stage())}
function pupilReady(){return document.body.classList.contains('nmb-v8-pupil-challenge')&&!!banner()}
function setLabel(button,label,title){if(!button)return;if(button.textContent.trim()!==label)button.textContent=label;if(title&&button.title!==title)button.title=title}
function tidy(){
  if(!pupilReady())return false;
  const actions=q('.gd-challenge-actions',banner());if(!actions)return false;
  const buttons=[...actions.querySelectorAll('button')];
  setLabel(q('[data-nmb-v9-change]',actions)||buttons.find(b=>/^change$/i.test(b.textContent.trim())),'Change','Choose a different Number Mobile challenge');
  setLabel(q('[data-nmb-v6-another]',actions)||buttons.find(b=>/^another(?: like this)?$/i.test(b.textContent.trim())),'Another','Generate another challenge of this type');
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
  for(let i=0;i<24&&token===runToken;i++){
    if(tidy()){
      /* Continue a short bounded settling window because v6/v7 may append
         their buttons a frame or two after pupil mode first becomes visible. */
      for(let j=0;j<12&&token===runToken;j++){await new Promise(r=>setTimeout(r,45));tidy()}
      return;
    }
    await new Promise(r=>setTimeout(r,45));
  }
}
function relevant(target){return !!target?.closest?.('[data-nmb-v6-type],[data-nmb-v6-another],[data-nmb-v9-change],[data-nmb-challenge-toggle],[data-board-action="reveal"],[data-nmb-v7-exit]')}
function install(){
  window.addEventListener('click',e=>{if(relevant(e.target))setTimeout(stabilise,0)},true);
  document.addEventListener('click',e=>{if(relevant(e.target))setTimeout(stabilise,0)},false);
  setTimeout(stabilise,80);
}
G.numberMobileChromeVersion='12.0';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})(window.TT99Goodies);
